'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Lyrics from '../../cumponents/lyricscard'
import Cookies from 'js-cookie';
const LyricsPage = () => {
  const searchParams = useSearchParams();
  const songTitle = searchParams.get('songTitle');
  const artistName = searchParams.get('artistName');
  const spotifyAccessToken = Cookies.get('spotifyAccessToken');
  const [spotifyAuthed, setSpotifyAuthed] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (songTitle && artistName) {
      const fetchLyrics = async () => {
        try {
          const response = await fetch(`/api/getLyrics?songTitle=${encodeURIComponent(songTitle)}&artistName=${encodeURIComponent(artistName)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch lyrics');
          }
          const data = await response.json();
          setLyrics(data.lyrics);
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('An unknown error occurred');
          }
        }
      };

      fetchLyrics();
    }
  }, [songTitle, artistName]);

  if (!songTitle || !artistName) {
    return <div>Loading...</div>;
  }
  const router = useRouter();
  console.log( 'token' , spotifyAccessToken)
  useEffect(() => {
    if (spotifyAccessToken) {
      setSpotifyAuthed(true);
    }
  }, [spotifyAccessToken]);

  const handleSpotifyAuth = async () => {
    if (spotifyAuthed) {
      try {
        const response = await fetch('/api/spotify/getTrack');
        const data = await response.json();
        if ('songTitle' in data && 'artistName' in data) {
          router.push(`/spotify-sync/lyrics?songTitle=${encodeURIComponent(data.songTitle)}&artistName=${encodeURIComponent(data.artistName)}`);
        } else {
          throw new Error('Failed to fetch current track');
        }
      } catch (error) {
        console.error('Error fetching current track:', error);

        initiateSpotifyAuth();
      }
    } else {
      initiateSpotifyAuth();
    }
  };

  const initiateSpotifyAuth = async () => {
    try {
      const response = await fetch('/api/spotify/auth');
      const data: { authUrl: string } = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error during Spotify auth:', error);
    }
  };  
  return (
    <div>
      
      <h1 className='flex justify-center text-3xl font-extrabold'>currently listening to {songTitle} by {artistName}</h1>
      <div className='flex justify-center'>
        <input type="button" value="refresh" onClick={handleSpotifyAuth} className="bg-green-500 text-white p-2 rounded mb-4" />
      </div>
      
      {
      error ? (
        <div>Error: {error}</div>
      ) : (
        <Lyrics lyrics={lyrics} />
      )}
    </div>
  );
};

const LyricsPageWithSuspense = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LyricsPage />
  </Suspense>
);

export default LyricsPageWithSuspense;
