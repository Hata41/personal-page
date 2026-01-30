import { useState } from 'react';

interface Publication {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi?: string;
  url?: string;
  keywords: string[];
}

interface Props {
  publications: Publication[];
}

export default function PublicationFilter({ publications }: Props): JSX.Element {
  const [filter, setFilter] = useState('');

  const filtered = publications.filter(pub =>
    pub.title.toLowerCase().includes(filter.toLowerCase()) ||
    pub.keywords.some(k => k.toLowerCase().includes(filter.toLowerCase())) ||
    pub.year.toString().includes(filter)
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Filter by title, keyword, or year"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5em', width: '100%' }}
      />
      <p>Showing {filtered.length} of {publications.length} publications</p>
      <ul>
        {filtered.map((pub, index) => (
          <li key={index}>
            <strong>{pub.title}</strong><br />
            Authors: {pub.authors.join(', ')}<br />
            {pub.venue}, {pub.year}<br />
            {pub.doi && <a href={`https://doi.org/${pub.doi}`}>DOI</a>}
            {pub.url && <a href={pub.url}>Link</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}