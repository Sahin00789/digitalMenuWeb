export const playNotificationSound = () => {
    if (typeof window === 'undefined') return;

    try {
        // Try to play from file first
        const audio = new Audio('/audio/notification.mp3');
        audio.play().catch(() => {
            // Fallback to Web Audio API beep
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        });
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};
