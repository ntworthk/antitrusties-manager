const ManagerState = {
    predictions: [],

    async loadPredictions() {
        try {
            const response = await fetch('https://cardioid.co.nz/api/predictions');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.predictions = data.predictions;
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

    async updatePredictionStatus(predictionId, status, notes = '') {
        try {
            const authCode = this.getAuthCode();
            if (!authCode) {
                const code = prompt('Please enter the authentication code:');
                if (!code) return null;
                this.setAuthCode(code);
            }

            const response = await fetch('https://cardioid.co.nz/api/update_prediction_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: predictionId,
                    status: status,
                    notes: notes,
                    auth_code: this.getAuthCode()
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                await this.loadPredictions(); // Refresh predictions after update
            }
            return data;
        } catch (error) {
            console.error('Error updating prediction status:', error);
            throw error;
        }
    }
};