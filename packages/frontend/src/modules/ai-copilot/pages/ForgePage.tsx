/**
 * ForgePage - Main page for the AI Copilot module
 * Redirects to the chat page since Situation Deck is now a core feature
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';

export function ForgePage() {
    const navigate = useNavigate();

    // Redirect to chat page
    useEffect(() => {
        navigate('/modules/ai-copilot/chat', { replace: true });
    }, [navigate]);

    // Show loading state while redirecting
    return (
        <div className="h-full flex items-center justify-center bg-gray-950">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
                    <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-400">Loading Forge...</p>
            </div>
        </div>
    );
}

export default ForgePage;
