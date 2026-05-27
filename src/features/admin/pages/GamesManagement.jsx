import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiEye, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import { useGames, useUpdateGame, useDeleteGame } from '@/services/mutators/useGames';
import { AdminPageHero, AdminPanel } from '../components/AdminContentShell';

const PAGE_SIZE = 5;

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'draft') {
    return 'Draft';
  }

  if (value === 'archived') {
    return 'Archived';
  }

  return 'Published';
}

function nextStatus(status) {
  if (status === 'Draft') {
    return 'Published';
  }

  if (status === 'Published') {
    return 'Archived';
  }

  return 'Published';
}

function getStatusClass(status) {
  // Returns an object for use with style prop
  if (status === 'Published') return { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' };
  if (status === 'Draft')     return { background: 'var(--status-draft-bg)',    color: 'var(--status-draft-text)' };
  return                               { background: 'var(--status-danger-bg)',  color: 'var(--status-danger-text)' };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function GamesManagement() {
  usePageTheme('admin');

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data: gamesData = [], isLoading } = useGames();
  const { mutate: updateGame } = useUpdateGame();
  const { mutate: deleteGame } = useDeleteGame();

  const games = useMemo(() => {
    return gamesData.map((game, index) => ({
      id: game.id,
      slug: game.slug,
      title: game.title,
      genre: game.genres?.[0] || 'Action',
      platform: game.platforms?.join(', ') || 'Multi-platform',
      status: normalizeStatus(game.status),
      views: Number(game.view_count || (game.aggregate_score || 0) * 7200 + (index + 1) * 240),
      reviews: game.expert_reviews?.length || 0,
    }));
  }, [gamesData]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return games.filter((game) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        game.title.toLowerCase().includes(normalizedQuery)
        || game.genre.toLowerCase().includes(normalizedQuery)
        || game.platform.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [games, query]);

  const pageCount = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedGames = filteredGames.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = (gameId) => {
    if (!window.confirm('Delete this game? This cannot be undone.')) return;
    deleteGame(gameId, {
      onSuccess: () => showToast('Game deleted', 'success'),
      onError: () => showToast('Failed to delete game', 'error'),
    });
  };

  const handleStatusToggle = (gameId, currentStatus) => {
    const newStatus = nextStatus(currentStatus).toLowerCase();
    updateGame({ id: gameId, status: newStatus }, {
      onSuccess: () => showToast('Game status updated', 'success'),
      onError: () => showToast('Failed to update status', 'error'),
    });
  };

  if (isLoading) {
    return <div className="admin-page-shell">Loading games...</div>;
  }

  return (
    <div className="admin-page-shell admin-table-page">
      <Helmet>
        <title>Games Management | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Content"
        title="Games Management"
        description="Search, review, and update GamePost records using the shared admin table system."
        actions={(
          <button
            type="button"
            className="admin-btn !border-emerald-600 !bg-emerald-600"
            onClick={() => navigate('/admin/games/create')}
          >
            <FiPlus size={16} />
            Create New Game
          </button>
        )}
      />

      <AdminPanel title="Games Library" meta="Searchable table with pagination and publishing controls">
        <div className="admin-filter-bar" style={{ gridTemplateColumns: 'minmax(280px, 1fr) auto' }}>
          <input
            className="admin-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title, genre, or platform"
          />
        </div>

        <div className="admin-table-wrapper mt-5">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Genre</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Views</th>
                <th>Reviews</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGames.map((game) => (
                <tr key={game.id}>
                  <td>
                    <div className="admin-table-title-cell">
                      <span className="admin-table-title-cell__title">{game.title}</span>
                      <span className="admin-table-title-cell__meta">/{game.slug}</span>
                    </div>
                  </td>
                  <td>{game.genre}</td>
                  <td>{game.platform}</td>
                  <td>
                    <span className="admin-status-badge" style={getStatusClass(game.status)}>{game.status}</span>
                  </td>
                  <td>{formatNumber(game.views)}</td>
                  <td>{game.reviews}</td>
                  <td>
                    <div className="admin-action-row justify-start">
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(`/admin/games/${game.id}/edit`)}>
                        <FiEdit2 size={14} />
                        Edit
                      </button>
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(`/games/${game.slug}`)}>
                        <FiEye size={14} />
                        View
                      </button>
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => handleStatusToggle(game.id, game.status)}>
                        Toggle Status
                      </button>
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => handleDelete(game.id)}>
                        <FiTrash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!paginatedGames.length ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    No games matched your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing {paginatedGames.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(currentPage * PAGE_SIZE, filteredGames.length)} of {filteredGames.length}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
              <FiChevronLeft size={14} />
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-600">Page {currentPage} of {pageCount}</span>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>
              Next
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
