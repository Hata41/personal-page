import { useState } from 'react';

interface Props {
  email: string;
}

export default function CopyEmailButton({ email }: Props): JSX.Element {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button onClick={copyToClipboard} style={{ marginLeft: '0.5rem', padding: '0.2em 0.5em' }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}