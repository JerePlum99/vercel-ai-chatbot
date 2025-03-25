import Form from 'next/form';
import { redirect } from 'next/navigation';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        // Call our custom sign-out endpoint to clear all cookies
        await fetch('/api/auth/signout', {
          method: 'POST',
        });
        
        // Redirect to login page
        redirect('/login');
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
