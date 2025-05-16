// Konfigurasi API (sebaiknya pindah ke environment variables)
const API_CONFIG = {
  etherscan: {
    key: 'ESX8HVJ39N3345BTYTQTK43J41G29SVKXS', // Gunakan environment variable di production
    endpoints: {
      price: 'https://api.etherscan.io/api?module=stats&action=ethprice',
      supply: 'https://api.etherscan.io/api?module=stats&action=ethsupply'
    }
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3'
  }
};

let ethChart;

document.addEventListener('DOMContentLoaded', function() {
  initializeChart();
  setupEventListeners();
  loadInitialData();
});

function initializeChart() {
  const ctx = document.getElementById('ethChart').getContext('2d');
  ethChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'ETH Price',
        data: [],
        borderColor: '#627EEA',
        backgroundColor: 'rgba(98, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }]
    },
    options: getChartOptions()
  });
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: context => `Price: $${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: { display: false },
      y: {
        display: true,
        grid: { drawBorder: false },
        ticks: {
          callback: value => `$${value.toFixed(2)}`
        }
      }
    }
  };
}

function setupEventListeners() {
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      fetchEthData(this.dataset.timeframe);
    });
  });
}

function loadInitialData() {
  fetchEthData('1D');
  setInterval(() => {
    const activeTimeframe = document.querySelector('.timeframe-btn.active').dataset.timeframe;
    fetchEthData(activeTimeframe);
  }, 60000);
}

async function fetchEthData(timeframe) {
  try {
    showLoadingState();
    
    const [history, currentPrice, change24h] = await Promise.all([
      fetchEthPriceHistory(timeframe),
      fetchCurrentEthPrice(),
      calculate24hChange()
    ]);
    
    updateChart(history, timeframe);
    updatePriceInfo(currentPrice, change24h);
    updateLastUpdatedTime();
  } catch (error) {
    console.error('Error fetching ETH data:', error);
    handleDataError(timeframe);
  }
}

async function fetchEthPriceHistory(timeframe) {
  try {
    // Etherscan tidak menyediakan historical price, jadi kita gunakan Coingecko
    const days = timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : 30;
    const response = await fetch(`${API_CONFIG.coingecko.baseUrl}/coins/ethereum/market_chart?vs_currency=usd&days=${days}`);
    
    if (!response.ok) throw new Error('Failed to fetch price history');
    
    const data = await response.json();
    return data.prices.map(([timestamp, price]) => ({
      time: new Date(timestamp),
      value: price
    }));
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
}

async function fetchCurrentEthPrice() {
  try {
    const response = await fetch(`${API_CONFIG.etherscan.endpoints.price}&apikey=${API_CONFIG.etherscan.key}`);
    const data = await response.json();
    
    if (data.status !== '1') throw new Error(data.message || 'Failed to fetch ETH price');
    return parseFloat(data.result.ethusd);
  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
}

async function calculate24hChange() {
  try {
    const response = await fetch(`${API_CONFIG.coingecko.baseUrl}/coins/ethereum/market_chart?vs_currency=usd&days=1`);
    const data = await response.json();
    
    if (!data.prices || data.prices.length < 2) throw new Error('Insufficient data for 24h change');
    
    const currentPrice = await fetchCurrentEthPrice();
    const price24hAgo = data.prices[0][1];
    return ((currentPrice / price24hAgo - 1) * 100);
  } catch (error) {
    console.error('Error calculating 24h change:', error);
    throw error;
  }
}

async function fetchEthMarketCap(currentPrice) {
  try {
    const response = await fetch(`${API_CONFIG.etherscan.endpoints.supply}&apikey=${API_CONFIG.etherscan.key}`);
    const data = await response.json();
    
    if (data.status !== '1') throw new Error(data.message || 'Failed to fetch ETH supply');
    const supply = parseFloat(data.result) / 10**18;
    return supply * currentPrice;
  } catch (error) {
    console.error('Error fetching market cap:', error);
    throw error;
  }
}

// UI Update Functions
function showLoadingState() {
  document.getElementById('eth-price').innerHTML = '<span class="loading-spinner"></span>';
  document.getElementById('eth-change').textContent = 'Loading...';
  document.getElementById('eth-marketcap').textContent = 'Loading...';
}

function updateChart(history, timeframe) {
  ethChart.data.labels = history.map(item => formatDate(item.time, timeframe));
  ethChart.data.datasets[0].data = history.map(item => item.value);
  ethChart.update();
}

function updatePriceInfo(currentPrice, change24h) {
  document.getElementById('eth-price').textContent = `$${currentPrice.toFixed(2)}`;
  
  const changeElement = document.getElementById('eth-change');
  changeElement.textContent = `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
  changeElement.className = `text-lg font-bold ${
    change24h > 0 ? 'positive' : change24h < 0 ? 'negative' : ''
  }`;
  
  fetchEthMarketCap(currentPrice).then(marketCap => {
    document.getElementById('eth-marketcap').textContent = `$${formatLargeNumber(marketCap)}`;
  });
}

async function handleDataError(timeframe) {
  try {
    const mockData = await generateMockEthData(timeframe);
    updateChart(mockData.prices, timeframe);
    document.getElementById('eth-price').textContent = `$${mockData.currentPrice.toFixed(2)}`;
    
    // Tetap tampilkan pesan error
    document.getElementById('eth-change').textContent = 'Data Error';
    document.getElementById('eth-marketcap').textContent = 'Data Error';
  } catch (mockError) {
    console.error('Failed to generate mock data:', mockError);
  }
}

// Helper functions
function formatDate(date, timeframe) {
  const d = new Date(date);
  return timeframe === '1D' 
    ? d.toLocaleTimeString([], {hour: '2-digit'})
    : d.toLocaleDateString([], {month: 'short', day: 'numeric'});
}

function formatLargeNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function updateLastUpdatedTime() {
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

// Fallback mock data generator
async function generateMockEthData(timeframe) {
  const basePrice = 3000;
  const config = {
    '1D': { points: 24, interval: 3600000, volatility: 0.05 },
    '7D': { points: 7, interval: 86400000, volatility: 0.08 },
    '1M': { points: 30, interval: 86400000, volatility: 0.1 }
  }[timeframe] || { points: 24, interval: 3600000, volatility: 0.05 };
  
  const prices = [];
  let currentValue = basePrice * (0.9 + Math.random() * 0.2);
  
  for (let i = 0; i < config.points; i++) {
    const change = (Math.random() > 0.5 ? 1 : -1) * Math.random() * config.volatility;
    currentValue = currentValue * (1 + change);
    prices.push({
      time: new Date(Date.now() - (config.points - i) * config.interval),
      value: currentValue
    });
  }
  
  return {
    prices,
    currentPrice: prices[prices.length - 1].value,
    change24h: ((prices[prices.length - 1].value / prices[0].value - 1) * 100)
  };
}