import React, { useState } from 'react';
import axios from 'axios';

const API_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY;

const formatArticleDate = (rawDate) => {
  const year = rawDate.slice(0, 4);
  const month = rawDate.slice(4, 6);
  const day = rawDate.slice(6, 8);
  const time = rawDate.slice(9, 13);
  return `${year}-${month}-${day} ${time.slice(0, 2)}:${time.slice(2)}`;
};

const fetchGeneralNews = async () => {
  const newsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${API_KEY}`;

  try {
    const response = await axios.get(newsUrl);
    const data = response.data;

    if (data && data.feed) {
      return data.feed.slice(0, 5).map(article => ({
        title: article.title,
        summary: article.summary,
        url: article.url,
        date: formatArticleDate(article.time_published)
      }));
    } else {
      return [];
    }
  } catch (error) {
    throw new Error('Error fetching general news: ' + error.message);
  }
};

const GeneralNews = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const news = await fetchGeneralNews();
      setNewsData(news);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-section">
      <h2>General Stock Market News</h2>
      <button onClick={loadNews} disabled={loading}>
        {loading ? "Loading..." : "Load News"}
      </button>

      {error && <p>{error}</p>}

      {newsData.length > 0 && (
        <ul>
          {newsData.map((article, index) => (
            <li key={index}>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
              <p>{article.summary}</p>
              <p><strong>Published on:</strong> {article.date}</p>
            </li>
          ))}
        </ul>
      )}

      {newsData.length === 0 && !loading && !error && <p>No news loaded yet.</p>}
    </div>
  );
};

export default GeneralNews;