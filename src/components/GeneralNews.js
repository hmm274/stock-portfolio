import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = process.env.ALPHAVANTAGE_KEY;

// Move fetchGeneralNews outside the component
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

const formatArticleDate = (rawDate) => {
  const year = rawDate.slice(0, 4);
  const month = rawDate.slice(4, 6);
  const day = rawDate.slice(6, 8);
  const time = rawDate.slice(9, 13);
  
  return `${year}-${month}-${day} ${time.slice(0, 2)}:${time.slice(2)}`; // Format as "YYYY-MM-DD HH:MM"
};

const GeneralNews = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const news = await fetchGeneralNews();
        setNewsData(news);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    loadNews();
  }, []); // No need to include fetchGeneralNews in the dependency array now

  if (loading) return <p>Loading news...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="news-section">
      <h2>General Stock Market News</h2>
      {newsData.length > 0 ? (
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
      ) : (
        <p>No news available at this time.</p>
      )}
    </div>
  );
};

export default GeneralNews;