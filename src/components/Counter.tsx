import { useState } from 'react';

/**
 * A simple counter component written in TypeScript.  Each click on the button
 * increases the count.  This demonstrates how to use React state in a
 * component embedded in an Astro page.
 */
export default function Counter(): JSX.Element {
  const [count, setCount] = useState<number>(0);
  return (
    <button
      type="button"
      onClick={() => setCount((c) => c + 1)}
      style={{ padding: '0.5em 1em', fontSize: '1rem' }}
    >
      Counter: {count}
    </button>
  );
}
