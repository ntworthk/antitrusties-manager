const ManagerUI = {
    initialize() {
        this.refreshButton = document.getElementById('refresh-button');
        this.predictionsGrid = document.querySelector('.predictions-grid');
        
        this.setupEventListeners();
        this.loadPredictions();
    },

    setupEventListeners() {
        this.refreshButton.addEventListener('click', () => this.loadPredictions());
        
        // Event delegation for status updates
        this.predictionsGrid.addEventListener('click', async (e) => {
            if (e.target.classList.contains('status-button')) {
                const predictionId = e.target.closest('.prediction-card').dataset.id;
                const newStatus = e.target.dataset.status;
                
                try {
                    let notes = '';
                    if (newStatus === 'correct' || newStatus === 'incorrect') {
                        notes = prompt('Add any notes about this outcome:') || '';
                    }
                    
                    const result = await ManagerState.updatePredictionStatus(predictionId, newStatus, notes);
                    if (result?.status === 'error' && result?.message?.includes('Invalid authentication')) {
                        localStorage.removeItem('authCode');
                        alert('Authentication failed. Please try again.');
                        return;
                    }
                    await this.loadPredictions();
                } catch (error) {
                    alert('Error updating prediction status');
                }
            }
        });
    },

    async loadPredictions() {
        try {
            this.refreshButton.classList.add('rotating');
            await ManagerState.loadPredictions();
            this.renderPredictions();
        } catch (error) {
            alert('Error loading predictions');
        } finally {
            this.refreshButton.classList.remove('rotating');
        }
    },

    renderPredictions() {
        this.predictionsGrid.innerHTML = '';
        
        if (ManagerState.predictions.length === 0) {
            this.predictionsGrid.innerHTML = `
                <div class="no-predictions">
                    No predictions have been submitted yet.
                </div>
            `;
            return;
        }

        ManagerState.predictions.forEach(prediction => {
            const predictionCard = document.createElement('div');
            predictionCard.className = 'prediction-card';
            predictionCard.dataset.id = prediction.id;
            
            const statusIcon = prediction.status === 'correct' ? 'fa-check-circle text-success' :
                             prediction.status === 'incorrect' ? 'fa-times-circle text-danger' :
                             'fa-question-circle text-warning';
            
            predictionCard.innerHTML = `
                <div class="prediction-content">
                    <div class="status-indicator" title="Current status">
                        <i class="fas ${statusIcon}"></i>
                    </div>
                    <div class="prediction-text-container">
                        <p class="prediction-text">${prediction.text}</p>
                        ${prediction.notes ? `<p class="prediction-notes">${prediction.notes}</p>` : ''}
                    </div>
                    <div class="status-controls">
                        <button class="status-button ${prediction.status === 'pending' ? 'active' : ''}"
                                data-status="pending">
                            Pending
                        </button>
                        <button class="status-button ${prediction.status === 'correct' ? 'active' : ''}"
                                data-status="correct">
                            Correct
                        </button>
                        <button class="status-button ${prediction.status === 'incorrect' ? 'active' : ''}"
                                data-status="incorrect">
                            Incorrect
                        </button>
                    </div>
                </div>
            `;
            
            this.predictionsGrid.appendChild(predictionCard);
        });
    }
};