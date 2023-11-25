import { render, fireEvent } from '@testing-library/react';
import Home from './Home';
import '@testing-library/jest-dom';

describe('Home Component', () => {
  it('renders video player', () => {
    const videos = ['video1.mp4', 'video2.mp4'];
    const { getByTestId } = render(<Home videos={videos} />);
    const videoPlayer = getByTestId('video-player');
    expect(videoPlayer).toBeInTheDocument();
  });

  // Add more tests for event handling, state changes, etc.
});