import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { useAuth } from '@/app/providers/useAuth';
import { usePageTheme } from '@/app/providers/ThemeProvider';

export default function BlogWriteGate() {
  const { isAuthenticated, isAdmin } = useAuth();
  usePageTheme('blog');

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/blogs/create" replace />;
  }

  return (
    <section className="bl-gate">
      <Helmet>
        <title>Write a Blog | GzoneSphere</title>
        <meta
          name="description"
          content="Blog publishing is currently available to GzoneSphere admins in Phase 1."
        />
      </Helmet>

      <div className="container-global">
        <div className="bl-gate__hero">
          <p className="bl-gate__eyebrow">Phase 1 Editorial Access</p>
          <h1 className="bl-gate__title">Writing is admin-managed right now</h1>
          <p className="bl-gate__text">
            Community publishing opens in a later phase. For now, public write CTAs route here so
            signed-in members get a clear explanation and a polished next step instead of a broken flow.
          </p>

          <div className="bl-gate__actions">
            <Link to="/blog" className="bl-btn-primary">Back to Blogs</Link>
            <Link to="/games" className="bl-btn-outline">Explore Games</Link>
          </div>
        </div>

        <div className="bl-gate__grid">
          <article className="bl-gate__card">
            <h2>What opens in later phases</h2>
            <ul className="bl-gate__list">
              <li>User-authored guides, reviews, and editorial submissions.</li>
              <li>Game-tagged posts that surface inside each GamePost page.</li>
              <li>Writing reputation, featured badges, and profile crediting.</li>
            </ul>
          </article>

          <article className="bl-gate__card">
            <h2>How the system is meant to work</h2>
            <ul className="bl-gate__list">
              <li>Blogs act as the editorial layer of Games, Community, and Tournaments.</li>
              <li>Every article should strengthen author identity and cross-navigation.</li>
              <li>Admin review keeps quality, formatting, and tagging consistent.</li>
            </ul>
          </article>

          <article className="bl-gate__card">
            <h2>What you can do now</h2>
            <ul className="bl-gate__list">
              <li>Read current guides, reviews, and editorial features.</li>
              <li>Explore game hubs for related articles and community context.</li>
              <li>Prepare your writing workflow for the public submission phase.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
