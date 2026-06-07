import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MyAwesomeTool from './MyAwesomeTool';

describe('MyAwesomeTool Guard Tests', () => {
  it('renders the community tool correctly', () => {
    const handleClose = vi.fn();
    render(<MyAwesomeTool onClose={handleClose} />);
    
    // Check if the main title renders
    expect(screen.getByText('My Awesome Tool')).toBeTruthy();
    expect(screen.getByText('This is where the magic happens.')).toBeTruthy();
  });

  it('calls onClose when Escape key is pressed (Security Guideline)', () => {
    const handleClose = vi.fn();
    render(<MyAwesomeTool onClose={handleClose} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(<MyAwesomeTool onClose={handleClose} />);
    
    fireEvent.click(screen.getByTestId('overlay'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
