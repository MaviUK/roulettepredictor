// European roulette wheel numbers in order (clockwise)
const wheelNumbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Initialize variables
let spinHistory = [];
let currentDirection = null;
let currentCWStreak = 0;
let currentCCWStreak = 0;
let longestCWStreak = 0;
let longestCCWStreak = 0;
let longestCombinedStreak = 0;

// Initialize the wheel visualization
function initWheel() {
    const wheel = document.getElementById('wheel');
    const pocketAngle = 360 / wheelNumbers.length;
    
    wheelNumbers.forEach((num, index) => {
        const pocket = document.createElement('div');
        pocket.className = 'pocket';
        pocket.textContent = num;
        pocket.style.transform = `rotate(${index * pocketAngle}deg) translate(0, -150px) rotate(${-index * pocketAngle}deg)`;
        
        // Color pockets
        if (num === 0) {
            pocket.style.color = 'white';
            pocket.style.backgroundColor = 'green';
        } else if (num % 2 === 0) {
            pocket.style.backgroundColor = 'black';
        } else {
            pocket.style.backgroundColor = 'red';
        }
        
        wheel.appendChild(pocket);
    });
}

// Add a spin to history
function addSpin(number, direction) {
    // Validate input
    if (number < 0 || number > 36 || !['CW', 'CCW'].includes(direction)) {
        console.error('Invalid spin data');
        return;
    }
    
    // Calculate pockets from previous spin if available
    let pockets = null;
    let fromNumber = null;
    
    if (spinHistory.length > 0) {
        const lastSpin = spinHistory[spinHistory.length - 1];
        fromNumber = lastSpin.number;
        pockets = calculatePockets(fromNumber, number, direction);
    }
    
    // Update streaks
    updateStreaks(direction);
    
    // Add to history
    const spin = {
        number,
        direction,
        from: fromNumber,
        pockets,
        timestamp: new Date()
    };
    
    spinHistory.push(spin);
    updateHistoryTable();
    updateStreakDisplay();
}

// Calculate pockets between two numbers in a given direction
function calculatePockets(from, to, direction) {
    const fromIndex = wheelNumbers.indexOf(from);
    const toIndex = wheelNumbers.indexOf(to);
    
    if (fromIndex === -1 || toIndex === -1) return null;
    
    if (direction === 'CW') {
        if (toIndex > fromIndex) {
            return toIndex - fromIndex;
        } else {
            return wheelNumbers.length - fromIndex + toIndex;
        }
    } else { // CCW
        if (toIndex < fromIndex) {
            return fromIndex - toIndex;
        } else {
            return wheelNumbers.length - toIndex + fromIndex;
        }
    }
}

// Update streak counters
function updateStreaks(direction) {
    if (direction === 'CW') {
        currentCWStreak++;
        currentCCWStreak = 0;
        if (currentCWStreak > longestCWStreak) {
            longestCWStreak = currentCWStreak;
        }
    } else {
        currentCCWStreak++;
        currentCWStreak = 0;
        if (currentCCWStreak > longestCCWStreak) {
            longestCCWStreak = currentCCWStreak;
        }
    }
    
    const currentCombined = currentCWStreak + currentCCWStreak;
    if (currentCombined > longestCombinedStreak) {
        longestCombinedStreak = currentCombined;
    }
    
    currentDirection = direction;
}

// Predict the next number
function predictNext() {
    if (spinHistory.length < 5) {
        return {
            success: false,
            message: "Need at least 5 spins in the current direction to make a prediction"
        };
    }
    
    // Get last 5 spins in the next direction (opposite of current)
    const nextDirection = currentDirection === 'CW' ? 'CCW' : 'CW';
    const last5Spins = spinHistory
        .filter(spin => spin.direction === nextDirection)
        .slice(-5);
    
    if (last5Spins.length < 5) {
        return {
            success: false,
            message: `Need at least 5 spins in ${nextDirection} direction to make a prediction`
        };
    }
    
    // Calculate pockets for each of the last 5 spins
    const pocketData = [];
    for (let i = 1; i < last5Spins.length; i++) {
        const from = last5Spins[i-1].number;
        const to = last5Spins[i].number;
        const pockets = calculatePockets(from, to, nextDirection);
        pocketData.push(pockets);
    }
    
    // Remove highest and lowest, average the remaining 3
    pocketData.sort((a, b) => a - b);
    const middle3 = pocketData.slice(1, -1);
    const averagePockets = Math.round(middle3.reduce((sum, val) => sum + val, 0) / middle3.length);
    
    // Get current number
    const currentNumber = spinHistory[spinHistory.length - 1].number;
    const currentIndex = wheelNumbers.indexOf(currentNumber);
    
    // Calculate predicted number
    let predictedIndex;
    if (nextDirection === 'CW') {
        predictedIndex = (currentIndex + averagePockets) % wheelNumbers.length;
    } else {
        predictedIndex = (currentIndex - averagePockets + wheelNumbers.length) % wheelNumbers.length;
    }
    
    const predictedNumber = wheelNumbers[predictedIndex];
    
    return {
        success: true,
        predictedNumber,
        predictedDirection: nextDirection,
        averagePockets,
        currentNumber,
        calculationSteps: {
            last5Spins,
            pocketData,
            middle3,
            averagePockets
        }
    };
}

// Update the history table
function updateHistoryTable() {
    const tableBody = document.getElementById('historyTable');
    tableBody.innerHTML = '';
    
    const displaySpins = spinHistory.slice().reverse().slice(0, 50); // Show last 50 spins
    
    displaySpins.forEach((spin, i) => {
        const row = document.createElement('tr');
        
        if (spin.direction === 'CW') {
            row.classList.add('table-warning');
        } else {
            row.classList.add('table-info');
        }
        
        row.innerHTML = `
            <td>${spinHistory.length - i}</td>
            <td>${spin.number}</td>
            <td>${spin.direction}</td>
            <td>${spin.from !== null ? spin.from : '-'}</td>
            <td>${spin.number}</td>
            <td>${spin.pockets !== null ? spin.pockets : '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update streak display
function updateStreakDisplay() {
    document.getElementById('cwStreak').textContent = longestCWStreak;
    document.getElementById('ccwStreak').textContent = longestCCWStreak;
    document.getElementById('currentCWStreak').textContent = currentCWStreak;
    document.getElementById('currentCCWStreak').textContent = currentCCWStreak;
}

// Animate the wheel spin
function animateSpin(number, direction, callback) {
    const wheel = document.getElementById('wheel');
    const ball = document.getElementById('ball');
    
    const numberIndex = wheelNumbers.indexOf(number);
    const rotationAngle = 360 * 5 + (numberIndex * (360 / wheelNumbers.length));
    
    // Set initial position
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    ball.style.transition = 'none';
    ball.style.opacity = '1';
    
    // Force reflow
    void wheel.offsetWidth;
    
    // Animate
    wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.21, 0.99)';
    wheel.style.transform = `rotate(${-rotationAngle}deg)`;
    
    // Animate ball
    setTimeout(() => {
        ball.style.transition = 'all 0.5s ease-out';
        ball.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
    }, 4500);
    
    // Callback when animation completes
    setTimeout(() => {
        if (callback) callback();
    }, 5000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initWheel();
    
    // Spin button
    document.getElementById('spinBtn').addEventListener('click', () => {
        const randomNumber = Math.floor(Math.random() * 37);
        const randomDirection = Math.random() > 0.5 ? 'CW' : 'CCW';
        
        animateSpin(randomNumber, randomDirection, () => {
            addSpin(randomNumber, randomDirection);
        });
    });
    
    // Predict button
    document.getElementById('predictBtn').addEventListener('click', () => {
        const prediction = predictNext();
        const resultDiv = document.getElementById('predictionResult');
        
        if (prediction.success) {
            resultDiv.innerHTML = `
                <p><strong>Predicted Number:</strong> ${prediction.predictedNumber}</p>
                <p><strong>Predicted Direction:</strong> ${prediction.predictedDirection}</p>
                <p><strong>From Current Number:</strong> ${prediction.currentNumber}</p>
                <p><strong>Pockets to move:</strong> ${prediction.averagePockets} ${prediction.predictedDirection}</p>
            `;
        } else {
            resultDiv.textContent = prediction.message;
        }
    });
    
    // Add spin button
    document.getElementById('addSpinBtn').addEventListener('click', () => {
        const number = parseInt(document.getElementById('numberInput').value);
        const direction = document.getElementById('directionInput').value;
        
        if (isNaN(number) || number < 0 || number > 36) {
            alert('Please enter a valid number between 0 and 36');
            return;
        }
        
        addSpin(number, direction);
    });
    
    // Add random spin button
    document.getElementById('addRandomBtn').addEventListener('click', () => {
        const randomNumber = Math.floor(Math.random() * 37);
        const randomDirection = Math.random() > 0.5 ? 'CW' : 'CCW';
        
        document.getElementById('numberInput').value = randomNumber;
        document.getElementById('directionInput').value = randomDirection;
        addSpin(randomNumber, randomDirection);
    });
});
// [Previous code remains the same until the event listeners section]

// Modify the addBatchSpins function to alternate directions
function addBatchSpins(spinData) {
    if (!Array.isArray(spinData)) {
        console.error('Batch data must be an array');
        return false;
    }

    let lastDirection = spinHistory.length > 0 
        ? spinHistory[spinHistory.length - 1].direction 
        : null;

    spinData.forEach((spin, index) => {
        // For the first spin in history, we need manual direction
        if (spinHistory.length === 0 && !spin.direction) {
            console.error(`First spin must have direction (spin ${index})`);
            return;
        }

        // For subsequent spins, alternate direction if not provided
        if (!spin.direction) {
            if (!lastDirection) {
                // Shouldn't happen as we checked first spin above
                console.error('Direction could not be determined');
                return;
            }
            spin.direction = lastDirection === 'CW' ? 'CCW' : 'CW';
        }

        addSpin(spin.number, spin.direction);
        lastDirection = spin.direction;
    });

    return true;
}

// Update the batch import event listener to clarify alternating directions
document.getElementById('batchImportBtn').addEventListener('click', () => {
    const batchInput = prompt(`Enter spins in format:\nnumber,direction(optional)\nDirections will alternate if not specified\nExample:\n17,CW\n32\n5\n0\n(Will alternate CW, CCW, CW, CCW)`);
    
    if (!batchInput) return;
    
    const spinLines = batchInput.split('\n');
    const batchData = [];
    
    spinLines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        const parts = line.split(',');
        const number = parseInt(parts[0]);
        
        if (isNaN(number) || number < 0 || number > 36) {
            alert(`Invalid number: ${parts[0]}`);
            return;
        }
        
        batchData.push({
            number: number,
            direction: parts[1] ? parts[1].trim().toUpperCase() : null
        });
    });
    
    if (batchData.length > 0) {
        addBatchSpins(batchData);
    }
});
