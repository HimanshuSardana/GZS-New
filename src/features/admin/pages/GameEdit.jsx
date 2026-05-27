import React from 'react';
import GamePostWizard from '../components/GamePostWizard';
import { useUpdateGamePost } from '@/services/mutators/useGames';

export default function GameEdit() {
  const updateGamePost = useUpdateGamePost();

  const handleSave = ({ id, data }) => updateGamePost.mutate({ id, data });

  return (
    <GamePostWizard
      mode="edit"
      onSave={handleSave}
      isSaving={updateGamePost.isPending}
    />
  );
}
