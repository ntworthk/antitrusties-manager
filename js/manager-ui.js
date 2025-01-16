const ManagerUI = {
    initialize() {
        this.refreshButton = document.getElementById('refresh-button');
        this.submitButton = document.getElementById('submit-button');
        this.predictionsGrid = document.querySelector('.predictions-grid');
        
        this.setupEventListeners();
        this.loadPredictions();
    },

    setupEventListeners() {
        this.refreshButton.addEventListener('click', () => this.loadPredictions());
        this.submitButton.addEventListener('click', () => this.submitUpdates());
        
        this.predictionsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-button')) {
                const card = e.target.closest('.prediction-card');
                const predictionId = card.dataset.id;
                const newStatus = e.target.dataset.status;
                
                const notesContainer = card.querySelector('.notes-container');
                const notesInput = card.querySelector('.notes-input');
                
                if (newStatus === 'pending') {
                    notesContainer.classList.add('hidden');
                    notesInput.value = '';
                    ManagerState.updatePrediction(predictionId, { status: newStatus });
                } else {
                    notesContainer.classList.remove('hidden');
                    ManagerState.updatePrediction(predictionId, { 
                        status: newStatus,
                        notes: notesInput.value
                    });
                }
                
                this.updateButtonStates(card, newStatus);
                this.updateSubmitButton();
            }
        });

        this.predictionsGrid.addEventListener('input', (e) => {
            if (e.target.matches('.notes-input, .prediction-text-input')) {
                const card = e.target.closest('.prediction-card');
                const predictionId = card.dataset.id;
                const changes = {};
                
                if (e.target.classList.contains('notes-input')) {
                    changes.notes = e.target.value;
                } else {
                    changes.text = e.target.value;
                }
                
                if (e.target.classList.contains('notes-input')) {
                    const status = card.querySelector('.status-button.active').dataset.status;
                    changes.status = status;
                }
                
                ManagerState.updatePrediction(predictionId, changes);
                this.updateSubmitButton();
            }
        });
    },

    updateButtonStates(card, activeStatus) {
        card.querySelectorAll('.status-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === activeStatus);
        });
    },

    updateSubmitButton() {
        this.submitButton.disabled = !ManagerState.hasModifications();
    },

    async submitUpdates() {
        try {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Submitting...';
            
            const result = await ManagerState.submitUpdates();
            if (result?.status === 'error' && result?.message?.includes('Invalid authentication')) {
                localStorage.removeItem('authCode');
            }
            
            this.loadPredictions();
        } catch (error) {
            console.error('Error submitting updates:', error);
        } finally {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Submit Changes';
        }
    },

    async loadPredictions() {
        try {
            this.refreshButton.classList.add('rotating');
            await ManagerState.loadPredictions();
            this.renderPredictions();
            this.updateSubmitButton();
        } catch (error) {
            console.error('Error loading predictions:', error);
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
                        <textarea 
                            class="prediction-text-input"
                            rows="2"
                        >${prediction.text}</textarea>
                        <div class="notes-container ${prediction.status === 'pending' ? 'hidden' : ''}">
                            <textarea 
                                class="notes-input"
                                placeholder="Add notes here..."
                                rows="2"
                            >${prediction.notes || ''}</textarea>
                        </div>
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