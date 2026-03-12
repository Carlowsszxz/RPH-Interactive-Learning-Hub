import { supabase } from './supabase-auth.js';

const games = [
	{
		id: 'trivia-battle',
		title: 'Trivia Battle',
		description: 'Answer multiple choice questions and compete on the leaderboard. Quick, Ranked, or Practice modes.',
		difficulty: 'medium',
		emoji: '🧠',
		page: 'FrameGameTriviaBattle.html'
	},
	{
		id: 'timeline',
		title: 'Timeline',
		description: 'Arrange events in chronological order. Test your historical knowledge!',
		difficulty: 'medium',
		emoji: '📅',
		page: 'FrameGameTimeline.html'
	}
	// Add more games here as you create them
];

function renderGameCards() {
	const grid = document.getElementById('gameCardsGrid');
	if (!grid) return;
	
	grid.innerHTML = '';
	
	if (games.length === 0) {
		grid.innerHTML = '<div class="no-games">No games available yet. Check back soon!</div>';
		return;
	}

	games.forEach(game => {
		const card = document.createElement('a');
		card.href = `/TEMPLATES/${game.page}`;
		card.className = 'game-card';
		
		card.innerHTML = `
			<div class="game-card-thumbnail">${game.emoji}</div>
			<div class="game-card-content">
				<h3 class="game-card-title">${game.title}</h3>
				<p class="game-card-description">${game.description}</p>
				<div class="game-card-footer">
					<span class="game-difficulty ${game.difficulty}">${game.difficulty}</span>
					<button class="game-play-btn">Play Now</button>
				</div>
			</div>
		`;
		
		grid.appendChild(card);
	});
}

document.addEventListener('DOMContentLoaded', () => {
	renderGameCards();
});