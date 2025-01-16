const ManagerState = {
    predictions: [],
    modifiedPredictions: new Map(),

    async loadPredictions() {
        try {
            const response = await fetch('https://cardioid.co.nz/api/predictions');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.predictions = data.predictions;
                this.modifiedPredictions.clear();
            } else if (data.message === 'No predictions table exists') {
                this.predictions = [];
            } else {
                throw new Error(data.message || 'Failed to load predictions');
            }
            
            return data;
        } catch (error) {
            console.error('Error loading predictions:', error);
            throw error;
        }
    },

    getAuthCode() {
        return localStorage.getItem('authCode') || '';
    },

    setAuthCode(code) {
        localStorage.setItem('authCode', code);
    },

    updatePrediction(id, changes) {
        this.modifiedPredictions.set(id, {
            ...this.modifiedPredictions.get(id) || {},
            ...changes
        });
    },

    hasModifications() {
        return this.modifiedPredictions.size > 0;
    },

    async submitUpdates() {
        if (!this.hasModifications()) return null;

        const authCode = this.getAuthCode();
        if (!authCode) {
            const code = prompt('Please enter the authentication code:');
            if (!code) return null;
            this.setAuthCode(code);
        }

        try {
            const updates = Array.from(this.modifiedPredictions.entries()).map(([id, data]) => ({
                id,
                ...(data.status && { status: data.status }),
                ...(data.notes && { notes: data.notes }),
                ...(data.text && { text: data.text })
            }));

            const response = await fetch('https://cardioid.co.nz/api/update_predictions_batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updates,
                    auth_code: this.getAuthCode()
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                this.modifiedPredictions.clear();
                await this.loadPredictions();
            }
            return data;
        } catch (error) {
            console.error('Error updating predictions:', error);
            throw error;
        }
    }
};