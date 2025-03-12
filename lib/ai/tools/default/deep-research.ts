// lib/ai/tools/default/deep-research.ts
import { tool, DataStreamWriter, generateText } from 'ai';
import { z } from 'zod';
import { 
  exaSearch, 
  exaGetContents,
  exaSearchAndContents
} from './exa-search';
import { 
  getExaClient
} from '@/lib/clients/exa';
import type { ContentOptions, ResultWithContent, SearchResponse } from '@/lib/types/exa';
import { openai } from '@ai-sdk/openai';

// Reasonng model for analysis
const reasoningModel = openai('o3-mini');

// Props interface for deep research tool
interface DeepResearchProps {
  dataStream: DataStreamWriter;
  onFinish?: (content: { 
    text: string;
    format: string;
    createArtifact: boolean;
    topic: string;
  }) => Promise<void>;
}

/**
 * Deep Research tool using Exa search and content extraction
 * Performs multi-step research with analysis and synthesis
 */
export const deepResearch = ({ dataStream, onFinish }: DeepResearchProps) => 
  tool({
    description: 'Perform deep research on a topic using an AI agent that coordinates search, extract, and analysis tools with reasoning steps. After research completes, you should either: 1) If createArtifact is true, call the createDocument tool with the research content to save it as a document, or 2) If createArtifact is false, include the full research content directly in your response. Never just provide a link to a report without either creating a document or showing the content.',
    parameters: z.object({
      topic: z.string().describe('The topic or question to research'),
      maxDepth: z.number().optional().describe('Maximum research depth (default: 7)'),
      createArtifact: z.boolean().optional().describe('Whether to create a document artifact with the research results (default: false)'),
    }),
    execute: async ({ topic, maxDepth = 7, createArtifact = false }) => {
      const startTime = Date.now();
      const timeLimit = 4.5 * 60 * 1000; // 4 minutes 30 seconds in milliseconds

      const researchState = {
        findings: [] as Array<{ text: string; source: string }>,
        summaries: [] as Array<string>,
        nextSearchTopic: topic,
        urlToSearch: '',
        currentDepth: 0,
        failedAttempts: 0,
        maxFailedAttempts: 3,
        completedSteps: 0,
        totalExpectedSteps: maxDepth * 5,
        identifiedGaps: [] as string[],
        themes: [] as string[],
        minimumIterations: Math.min(3, maxDepth), // Ensure at least 3 iterations when possible
        iterationStartTime: Date.now(), // Track time for each iteration
      };

      // Initialize progress tracking
      dataStream.writeData({
        type: 'progress-init',
        content: {
          maxDepth,
          totalSteps: researchState.totalExpectedSteps,
        },
      });

      const addSource = (source: {
        url: string;
        title: string;
        description: string;
      }) => {
        dataStream.writeData({
          type: 'source-delta',
          content: source,
        });
      };

      const addActivity = (activity: {
        type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought';
        status: 'pending' | 'complete' | 'error';
        message: string;
        timestamp: string;
        depth: number;
      }) => {
        if (activity.status === 'complete') {
          researchState.completedSteps++;
        }
        
        dataStream.writeData({
          type: 'activity-delta',
          content: {
            ...activity,
            depth: researchState.currentDepth,
            completedSteps: researchState.completedSteps,
            totalSteps: researchState.totalExpectedSteps,
          },
        });
      };

      // New function for advanced analysis and planning using o3-mini model
      const analyzeAndPlan = async (
        findings: Array<{ text: string; source: string }>,
        currentTopic: string,
      ): Promise<{
        summary: string;
        gaps: string[];
        nextSteps: string[];
        shouldContinue: boolean;
        nextSearchTopic?: string;
        urlToSearch?: string;
        themes?: string[];
      }> => {
        try {
          // Calculate time remaining for research
          const timeElapsed = Date.now() - startTime;
          const timeRemaining = timeLimit - timeElapsed;
          const timeRemainingMinutes = Math.round((timeRemaining / 1000 / 60) * 10) / 10;

          // Add reasoning activity
          addActivity({
            type: 'reasoning',
            status: 'pending',
            message: 'Analyzing findings and planning next steps',
            timestamp: new Date().toISOString(),
            depth: researchState.currentDepth,
          });

          // Generate analysis using o3-mini model
          const result = await generateText({
            model: reasoningModel,
            prompt: `You are a research agent working to write a thorough research report on: ${currentTopic}
            You have ${timeRemainingMinutes} minutes remaining to complete the research but you don't need to use all of it.
            
            Current findings: ${findings
              .slice(-5) // Focus on most recent findings to avoid token limits
              .map((f) => `[From ${f.source}]: ${f.text.slice(0, 3000)}`)
              .join('\n\n')}
            
            What has been learned? What gaps remain? What specific aspects should be investigated next if any?
            Identify key themes emerging from the research that will be useful for structuring the final report.
            If you need to search for more information, include a nextSearchTopic.
            If you need to search for more information in a specific URL, include a urlToSearch.
            
            IMPORTANT: Be conservative about concluding the research. Only set shouldContinue to false if:
            1. You have extremely comprehensive information from multiple sources that thoroughly answers the topic
            2. You have less than 30 seconds remaining
            3. You've already explored 5+ different angles on the topic
            
            Generally, aim to continue research for at least 3-5 iterations to ensure depth and comprehensiveness.
            Current depth is ${researchState.currentDepth} of a target minimum of ${researchState.minimumIterations}.
            
            Respond in this exact JSON format:
            {
              "analysis": {
                "summary": "summary of findings so far",
                "themes": ["theme1", "theme2", "theme3"],
                "gaps": ["gap1", "gap2"],
                "nextSteps": ["step1", "step2"],
                "shouldContinue": true/false,
                "nextSearchTopic": "optional topic for next search",
                "urlToSearch": "optional url to explore further"
              }
            }`,
          });

          // Extract and parse the JSON response
          let analysisData;
          try {
            // Find JSON content in the response
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            const jsonContent = jsonMatch ? jsonMatch[0] : result.text;
            
            const parsed = JSON.parse(jsonContent);
            analysisData = parsed.analysis;
            
            addActivity({
              type: 'reasoning',
              status: 'complete',
              message: `Analysis complete: ${analysisData.summary.slice(0, 100)}...`,
              timestamp: new Date().toISOString(),
              depth: researchState.currentDepth,
            });
            
            // Apply minimum iterations logic - force continue if we haven't met the minimum
            if (researchState.currentDepth < researchState.minimumIterations && 
                timeRemaining > 60000 && // Ensure at least 1 minute remaining
                analysisData) {
              
              addActivity({
                type: 'thought',
                status: 'pending',
                message: `Enforcing minimum iteration requirement (${researchState.currentDepth}/${researchState.minimumIterations})`,
                timestamp: new Date().toISOString(),
                depth: researchState.currentDepth,
              });
              
              analysisData.shouldContinue = true;
              
              // If we don't have a next topic but need to continue, create one
              if (!analysisData.nextSearchTopic && analysisData.gaps && analysisData.gaps.length > 0) {
                analysisData.nextSearchTopic = analysisData.gaps[0];
              } else if (!analysisData.nextSearchTopic) {
                analysisData.nextSearchTopic = `${currentTopic} deeper analysis`;
              }
            }
            
            // Store identified themes for final synthesis
            if (analysisData.themes && analysisData.themes.length > 0) {
              researchState.themes = [...(researchState.themes || []), ...analysisData.themes];
            }
            
            return {
              summary: analysisData.summary || "No summary provided",
              gaps: analysisData.gaps || [],
              nextSteps: analysisData.nextSteps || [],
              shouldContinue: analysisData.shouldContinue || false,
              nextSearchTopic: analysisData.nextSearchTopic || undefined,
              urlToSearch: analysisData.urlToSearch || undefined,
              themes: analysisData.themes || [],
            };
          } catch (error) {
            console.error('Failed to parse AI response:', error);
            console.log('Raw response:', result.text);
            
            addActivity({
              type: 'reasoning',
              status: 'error',
              message: 'Failed to parse analysis response',
              timestamp: new Date().toISOString(),
              depth: researchState.currentDepth,
            });
            
            // Fallback to simple keyword extraction
            const keywords = extractKeywords(findings.map(f => f.text).join("\n\n"));
            return {
              summary: "Analysis parsing failed, using keyword extraction as fallback",
              gaps: [],
              nextSteps: [`Research "${currentTopic} ${keywords[0] || ''}""`],
              shouldContinue: currentTopic !== topic, // Only continue if we're not still on the original topic
              nextSearchTopic: keywords.length > 0 ? `${currentTopic} ${keywords[0]}` : undefined,
              urlToSearch: undefined,
              themes: [],
            };
          }
        } catch (error) {
          console.error('Analysis error:', error);
          
          addActivity({
            type: 'reasoning',
            status: 'error',
            message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            depth: researchState.currentDepth,
          });
          
          // Return fallback response
          return {
            summary: "Analysis failed",
            gaps: [],
            nextSteps: [],
            shouldContinue: false,
            nextSearchTopic: undefined,
            urlToSearch: undefined,
            themes: [],
          };
        }
      };

      // Function to perform a single iteration of research
      const performResearchIteration = async (
        searchTopic: string,
        depth: number
      ): Promise<{
        success: boolean;
        findings: Array<{ text: string; source: string }>;
        shouldContinue: boolean;
        nextTopic?: string;
      }> => {
        if (depth > maxDepth) {
          return {
            success: true,
            findings: [],
            shouldContinue: false
          };
        }

        researchState.currentDepth = depth;

        // Search phase
        addActivity({
          type: 'search',
          status: 'pending',
          message: `Searching for "${searchTopic}" (Depth: ${depth}/${maxDepth})`,
          timestamp: new Date().toISOString(),
          depth,
        });

        // Use the Exa client directly
        const client = getExaClient();
        const searchAndContentsResult = await client.searchAndContents(searchTopic, {
          numResults: 5,
          text: true,
          summary: true,
          highlights: true
        });

        if (!searchAndContentsResult || !searchAndContentsResult.results || searchAndContentsResult.results.length === 0) {
          addActivity({
            type: 'search',
            status: 'error',
            message: `No results found for "${searchTopic}"`,
            timestamp: new Date().toISOString(),
            depth,
          });
          
          return {
            success: false,
            findings: [],
            shouldContinue: false
          };
        }

        addActivity({
          type: 'search',
          status: 'complete',
          message: `Found ${searchAndContentsResult.results.length} relevant results for "${searchTopic}"`,
          timestamp: new Date().toISOString(),
          depth,
        });

        // Add sources from search results
        searchAndContentsResult.results.forEach(result => {
          addSource({
            url: result.url,
            title: result.title || result.url,
            description: result.summary || result.text || 'No description available',
          });
        });

        // Extract content phase
        addActivity({
          type: 'extract',
          status: 'pending',
          message: `Analyzing top ${Math.min(5, searchAndContentsResult.results.length)} results`,
          timestamp: new Date().toISOString(),
          depth,
        });

        // Process findings from the combined search and contents response
        const findings = searchAndContentsResult.results.slice(0, 5).map((result) => ({
          text: result.text || result.summary || (result.highlights?.join('\n') || 'No content extracted'),
          source: result.url || 'Unknown source'
        }));

        addActivity({
          type: 'extract',
          status: 'complete',
          message: `Extracted content from ${findings.length} sources`,
          timestamp: new Date().toISOString(),
          depth,
        });

        // Analysis phase to determine next topic
        addActivity({
          type: 'analyze',
          status: 'pending',
          message: 'Analyzing findings to determine next research direction',
          timestamp: new Date().toISOString(),
          depth,
        });

        // Use AI reasoning instead of simple keyword extraction
        const analysis = await analyzeAndPlan(
          [...researchState.findings, ...findings], 
          searchTopic
        );
        
        addActivity({
          type: 'analyze',
          status: 'complete',
          message: analysis.nextSearchTopic 
            ? `Next research direction: "${analysis.nextSearchTopic}"` 
            : 'Research path complete',
          timestamp: new Date().toISOString(),
          depth,
        });
        
        // Save any identified gaps for potential future research
        if (analysis.gaps && analysis.gaps.length > 0) {
          researchState.identifiedGaps = [...researchState.identifiedGaps, ...analysis.gaps];
        }
        
        // Save summary
        if (analysis.summary) {
          researchState.summaries.push(analysis.summary);
        }

        return {
          success: true,
          findings,
          shouldContinue: analysis.shouldContinue,
          nextTopic: analysis.nextSearchTopic
        };
      };

      // Extract important keywords from text (simple implementation)
      const extractKeywords = (text: string): string[] => {
        // This is a simple implementation - in production use NLP or LLM for better extraction
        const stopwords = ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about", "as"];
        const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const wordCounts: Record<string, number> = {};
        
        words.forEach(word => {
          if (!stopwords.includes(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });
        
        return Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([word]) => word);
      };

      try {
        // Perform iterative research
        let currentTopic = topic;
        let currentDepth = 1;
        let allFindings: Array<{ text: string; source: string }> = [];
        
        while (currentDepth <= maxDepth && (Date.now() - startTime < timeLimit)) {
          // Update iteration start time
          researchState.iterationStartTime = Date.now();
          
          const result = await performResearchIteration(currentTopic, currentDepth);
          
          if (result.success) {
            allFindings = [...allFindings, ...result.findings];
            researchState.findings = [...allFindings];
            
            // If we've accumulated a significant amount of findings, do an intermediate synthesis
            // This helps organize information for the final report
            if (currentDepth % 3 === 0 && allFindings.length > 10) {
              addActivity({
                type: 'synthesis',
                status: 'pending',
                message: 'Creating intermediate research summary',
                timestamp: new Date().toISOString(),
                depth: currentDepth,
              });
              
              try {
                const intermediateSynthesis = await generateText({
                  model: reasoningModel,
                  prompt: `Create an organized summary of the research findings so far on: ${topic}
                  
                  Current findings:
                  ${allFindings.slice(-10).map((f, i) => `Source: ${f.source}\n${f.text.slice(0, 1500)}...`).join('\n\n')}
                  
                  Previous summaries:
                  ${researchState.summaries.join('\n\n')}
                  
                  Organize the key points into clear themes or categories. 
                  Highlight the most important discoveries and note areas that need further investigation.
                  
                  Format your response as a well-structured summary with clear sections by theme.`,
                });
                
                if (intermediateSynthesis.text) {
                  researchState.summaries.push(`[Intermediate Summary at Depth ${currentDepth}]: ${intermediateSynthesis.text}`);
                  
                  addActivity({
                    type: 'synthesis',
                    status: 'complete',
                    message: 'Created intermediate research summary',
                    timestamp: new Date().toISOString(),
                    depth: currentDepth,
                  });
                }
              } catch (error) {
                console.error('Intermediate synthesis error:', error);
                addActivity({
                  type: 'synthesis',
                  status: 'error',
                  message: 'Failed to create intermediate summary',
                  timestamp: new Date().toISOString(),
                  depth: currentDepth,
                });
              }
            }
            
            // If we should continue and have a next topic, continue research
            if ((result.shouldContinue || currentDepth < researchState.minimumIterations) 
                && result.nextTopic && currentDepth < maxDepth) {
              
              currentTopic = result.nextTopic;
              currentDepth++;
              
              // Log progress toward minimum iterations
              if (currentDepth <= researchState.minimumIterations) {
                addActivity({
                  type: 'thought',
                  status: 'complete',
                  message: `Continuing to iteration ${currentDepth}/${researchState.minimumIterations} (minimum required)`,
                  timestamp: new Date().toISOString(),
                  depth: currentDepth,
                });
              }
            } else {
              // Either we shouldn't continue, or we don't have a next topic, or we reached max depth
              addActivity({
                type: 'thought',
                status: 'complete',
                message: result.shouldContinue ? 'Maximum depth reached' : 'Research complete based on analysis',
                timestamp: new Date().toISOString(),
                depth: currentDepth,
              });
              break;
            }
          } else {
            // If search failed, try a different approach or end research
            researchState.failedAttempts++;
            if (researchState.failedAttempts >= researchState.maxFailedAttempts) {
              break;
            }
            
            // If we have identified gaps, use one of them as the next topic
            if (researchState.identifiedGaps.length > 0) {
              currentTopic = researchState.identifiedGaps.shift() || `alternative perspective on ${topic}`;
            } else {
              // Try a slightly different topic
              currentTopic = `alternative perspective on ${topic}`;
            }
          }
          
          // Check if we've exceeded time limit
          if (Date.now() - startTime >= timeLimit) {
            addActivity({
              type: 'thought',
              status: 'error',
              message: 'Research terminated due to time limit',
              timestamp: new Date().toISOString(),
              depth: currentDepth,
            });
            break;
          }
        }

        // Generate final synthesis and analysis
        addActivity({
          type: 'synthesis',
          status: 'pending',
          message: 'Preparing final analysis',
          timestamp: new Date().toISOString(),
          depth: currentDepth,
        });

        // Use reasoning model for final synthesis instead of simple concatenation
        let analysisText = '';
        
        try {
          // Final synthesis using o3-mini
          const finalAnalysis = await generateText({
            model: reasoningModel,
            prompt: `Create a comprehensive research report on: ${topic}
            
            Based on these research findings:
            ${allFindings.slice(0, 10).map((f, i) => `Source ${i+1} (${f.source}): ${f.text.slice(0, 2000)}...`).join('\n\n')}
            
            Previous analysis summaries:
            ${researchState.summaries.map((s, i) => `[Summary ${i+1}]: ${s}`).join('\n\n')}
            
            Key themes identified during research:
            ${researchState.themes.filter((v, i, a) => a.indexOf(v) === i).slice(0, 10).map((theme, i) => `${i+1}. ${theme}`).join('\n')}
            
            Your report should be structured as follows:
            
            # Research Report: ${topic}
            
            ## Executive Summary
            [Provide a concise overview of the key findings and conclusions]
            
            ## Key Findings
            [List the most important discoveries and insights, organized by themes]
            
            ## Detailed Analysis
            ${researchState.themes.filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map(theme => `### ${theme}\n[Analyze this theme based on the research findings]`).join('\n\n')}
            
            ## Supporting Evidence
            [Present relevant facts, statistics, expert opinions, and examples that support your analysis]
            
            ## Limitations & Gaps
            [Discuss any limitations in the current research and areas where information is lacking]
            ${researchState.identifiedGaps.length > 0 ? `Consider these identified gaps:\n${researchState.identifiedGaps.filter((v, i, a) => a.indexOf(v) === i).map((gap, i) => `- ${gap}`).join('\n')}` : ''}
            
            ## Conclusions
            [Summarize the main conclusions and their implications]
            
            Throughout your report:
            - Include relevant citations to sources where appropriate (use Source 1, Source 2, etc. format)
            - Provide balanced perspectives and consider alternative viewpoints
            - Prioritize accuracy and depth of analysis
            - Use clear, professional language
            
            This should be a comprehensive, detailed research report that thoroughly addresses the topic.`,
          });
          
          analysisText = finalAnalysis.text;
        } catch (error) {
          console.error('Final synthesis error:', error);
          
          // Fallback to simple concatenation if synthesis fails
          analysisText = `Research findings for "${topic}":\n\n` +
            allFindings.map((finding, i) => (
              `Source ${i+1}: ${finding.source}\n${finding.text.slice(0, 2000)}...\n`
            )).join('\n\n') +
            `\n\nResearch completed with ${currentDepth} iterations, finding ${allFindings.length} relevant sources.`;
        }

        addActivity({
          type: 'synthesis',
          status: 'complete',
          message: 'Research completed',
          timestamp: new Date().toISOString(),
          depth: currentDepth,
        });

        // Send the final result with proper formatting for the chat route
        const researchOutput = {
          text: analysisText,
          format: 'markdown',
          createArtifact: createArtifact,
          topic: topic
        };

        // Call onFinish callback if provided
        if (onFinish) {
          await onFinish(researchOutput);
        }

        dataStream.writeData({
          type: 'finish',
          content: researchOutput
        });

        return {
          success: true,
          data: {
            findings: researchState.findings,
            analysis: analysisText,
            completedSteps: researchState.completedSteps,
            totalSteps: researchState.totalExpectedSteps,
            createArtifact: createArtifact,
            topic: topic,
            // Add explicit instructions on what to do with the results
            nextSteps: createArtifact 
              ? "You should call the createDocument tool with this research content to save it as a document. Use an appropriate title based on the topic."
              : "You should include this full research content directly in your response to the user."
          }
        };
      } catch (error: any) {
        console.error('Deep research error:', error);

        addActivity({
          type: 'thought',
          status: 'error',
          message: `Research failed: ${error.message}`,
          timestamp: new Date().toISOString(),
          depth: researchState.currentDepth,
        });

        return {
          success: false,
          error: error.message,
          data: {
            findings: researchState.findings,
            completedSteps: researchState.completedSteps,
            totalSteps: researchState.totalExpectedSteps,
            createArtifact: createArtifact,
            topic: topic,
            // Guidance for error case
            nextSteps: "Report the research error to the user and share any partial findings that were gathered."
          }
        };
      }
    },
  });

export default deepResearch; 