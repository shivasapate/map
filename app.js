// Main App Logic
class MapApp {
    constructor() {
        this.map = new MapEngine('mapCanvas');
        this.favorites = JSON.parse(localStorage.getItem('mapFavorites')) || [];
        this.history = JSON.parse(localStorage.getItem('mapHistory')) || [];
        this.isDarkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
        
        this.setupUI();
        this.setupEventListeners();
        this.loadUIState();
    }
    
    setupUI() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkMode').checked = true;
        }
        
        this.renderFavorites();
        this.renderHistory();
    }
    
    setupEventListeners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.search());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
        
        document.getElementById('myLocationBtn').addEventListener('click', () => this.getMyLocation());
        document.getElementById('zoomIn').addEventListener('click', () => this.map.setZoom(this.map.zoom + 1));
        document.getElementById('zoomOut').addEventListener('click', () => this.map.setZoom(this.map.zoom - 1));
        document.getElementById('toggleMapType').addEventListener('click', () => this.toggleMapType());
        
        document.getElementById('routeBtn').addEventListener('click', () => this.openRoutePanel());
        document.getElementById('closeRoute').addEventListener('click', () => this.closeRoutePanel());
        document.getElementById('swapLocations').addEventListener('click', () => this.swapLocations());
        document.getElementById('findRouteBtn').addEventListener('click', () => this.findRoute());
        
        document.getElementById('closeSidebar').addEventListener('click', () => this.closeSidebar());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn')));
        });
        
        document.getElementById('darkMode').addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
        document.getElementById('trafficLayer').addEventListener('change', (e) => {
            this.map.showTraffic = e.target.checked;
            this.map.render();
        });
        document.getElementById('satelliteView').addEventListener('change', (e) => {
            this.map.satelliteView = e.target.checked;
            this.map.render();
        });
        
        window.addEventListener('mapClicked', (e) => this.handleMapClick(e.detail));
    }
    
    search() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;
        
        const searchResults = {
            'delhi': { lat: 28.6139, lng: 77.2090, name: 'दिल्ली', address: 'भारत की राजधानी' },
            'दिल्ली': { lat: 28.6139, lng: 77.2090, name: 'दिल्ली', address: 'भारत की राजधानी' },
            'noida': { lat: 28.5355, lng: 77.3910, name: 'नोएडा', address: 'उत्तर प्रदेश' },
            'नोएडा': { lat: 28.5355, lng: 77.3910, name: 'नोएडा', address: 'उत्तर प्रदेश' },
            'gurgaon': { lat: 28.4089, lng: 77.3178, name: 'गुड़गांव', address: 'हरियाणा' },
            'गुड़गांव': { lat: 28.4089, lng: 77.3178, name: 'गुड़गांव', address: 'हरियाणा' },
            'shimla': { lat: 31.1704, lng: 77.1811, name: 'शिमला', address: 'हिमाचल प्रदेश' },
            'शिमला': { lat: 31.1704, lng: 77.1811, name: 'शिमला', address: 'हिमाचल प्रदेश' },
            'dharamshala': { lat: 32.2140, lng: 75.8410, name: 'धर्मशाला', address: 'हिमाचल प्रदेश' },
            'धर्मशाला': { lat: 32.2140, lng: 75.8410, name: 'धर्मशाला', address: 'हिमाचल प्रदेश' },
            'rishikesh': { lat: 30.7333, lng: 77.0667, name: 'ऋषिकेश', address: 'उत्तराखंड' },
            'ऋषिकेश': { lat: 30.7333, lng: 77.0667, name: 'ऋषिकेश', address: 'उत्तराखंड' },
            'mumbai': { lat: 19.0760, lng: 72.8777, name: 'मुंबई', address: 'महाराष्ट्र' },
            'मुंबई': { lat: 19.0760, lng: 72.8777, name: 'मुंबई', address: 'महाराष्ट्र' },
            'bombay': { lat: 19.0760, lng: 72.8777, name: 'मुंबई', address: 'महाराष्ट्र' },
            'nagpur': { lat: 21.1458, lng: 79.0882, name: 'नागपुर', address: 'महाराष्ट्र' },
            'नागपुर': { lat: 21.1458, lng: 79.0882, name: 'नागपुर', address: 'महाराष्ट्र' },
            'pune': { lat: 18.5204, lng: 73.8567, name: 'पुणे', address: 'महाराष्ट्र' },
            'पुणे': { lat: 18.5204, lng: 73.8567, name: 'पुणे', address: 'महाराष्ट्र' },
            'indore': { lat: 22.7196, lng: 75.8577, name: 'इंदौर', address: 'मध्य प्रदेश' },
            'इंदौर': { lat: 22.7196, lng: 75.8577, name: 'इंदौर', address: 'मध्य प्रदेश' },
            'ujjain': { lat: 23.1815, lng: 75.7854, name: 'उज्जैन', address: 'मध्य प्रदेश' },
            'उज्जैन': { lat: 23.1815, lng: 75.7854, name: 'उज्जैन', address: 'मध्य प्रदेश' },
            'surat': { lat: 21.1703, lng: 72.8311, name: 'सूरत', address: 'गुजरात' },
            'सूरत': { lat: 21.1703, lng: 72.8311, name: 'सूरत', address: 'गुजरात' },
            'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'अहमदाबाद', address: 'गुजरात' },
            'अहमदाबाद': { lat: 23.0225, lng: 72.5714, name: 'अहमदाबाद', address: 'गुजरात' },
            'jaipur': { lat: 26.9124, lng: 75.7873, name: 'जयपुर', address: 'राजस्थान' },
            'जयपुर': { lat: 26.9124, lng: 75.7873, name: 'जयपुर', address: 'राजस्थान' },
            'bangalore': { lat: 12.9716, lng: 77.5946, name: 'बेंगलुरु', address: 'कर्नाटक' },
            'बेंगलुरु': { lat: 12.9716, lng: 77.5946, name: 'बेंगलुरु', address: 'कर्नाटक' },
            'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'बेंगलुरु', address: 'कर्नाटक' },
            'chennai': { lat: 13.0827, lng: 80.2707, name: 'चेन्नई', address: 'तमिलनाडु' },
            'चेन्नई': { lat: 13.0827, lng: 80.2707, name: 'चेन्नई', address: 'तमिलनाडु' },
            'madras': { lat: 13.0827, lng: 80.2707, name: 'चेन्नई', address: 'तमिलनाडु' },
            'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'हैदराबाद', address: 'तेलंगाना' },
            'हैदराबाद': { lat: 17.3850, lng: 78.4867, name: 'हैदराबाद', address: 'तेलंगाना' },
            'kochi': { lat: 9.9312, lng: 76.2673, name: 'कोच्चि', address: 'केरल' },
            'कोच्चि': { lat: 9.9312, lng: 76.2673, name: 'कोच्चि', address: 'केरल' },
            'cochin': { lat: 9.9312, lng: 76.2673, name: 'कोच्चि', address: 'केरल' },
            'mysore': { lat: 12.2958, lng: 76.6394, name: 'मैसूर', address: 'कर्नाटक' },
            'मैसूर': { lat: 12.2958, lng: 76.6394, name: 'मैसूर', address: 'कर्नाटक' },
            'pondicherry': { lat: 11.9273, lng: 79.8353, name: 'पांडिचेरी', address: 'पुदुचेरी' },
            'पांडिचेरी': { lat: 11.9273, lng: 79.8353, name: 'पांडिचेरी', address: 'पुदुचेरी' },
            'tirupati': { lat: 13.1939, lng: 79.8255, name: 'तिरुपति', address: 'आंध्र प्रदेश' },
            'तिरुपति': { lat: 13.1939, lng: 79.8255, name: 'तिरुपति', address: 'आंध्र प्रदेश' },
            'kolkata': { lat: 22.5726, lng: 88.3639, name: 'कोलकाता', address: 'पश्चिम बंगाल' },
            'कोलकाता': { lat: 22.5726, lng: 88.3639, name: 'कोलकाता', address: 'पश्चिम बंगाल' },
            'calcutta': { lat: 22.5726, lng: 88.3639, name: 'कोलकाता', address: 'पश्चिम बंगाल' },
            'patna': { lat: 25.5941, lng: 85.1376, name: 'पटना', address: 'बिहार' },
            'पटना': { lat: 25.5941, lng: 85.1376, name: 'पटना', address: 'बिहार' },
            'imphal': { lat: 24.7833, lng: 93.9500, name: 'इम्फाल', address: 'मणिपुर' },
            'इम्फाल': { lat: 24.7833, lng: 93.9500, name: 'इम्फाल', address: 'मणिपुर' },
            'silchar': { lat: 24.8222, lng: 92.7963, name: 'सिलचर', address: 'असम' },
            'सिलचर': { lat: 24.8222, lng: 92.7963, name: 'सिलचर', address: 'असम' },
            'guwahati': { lat: 26.1445, lng: 91.7362, name: 'गुवाहाटी', address: 'असम' },
            'गुवाहाटी': { lat: 26.1445, lng: 91.7362, name: 'गुवाहाटी', address: 'असम' },
            'jabalpur': { lat: 23.1815, lng: 79.9864, name: 'जबलपुर', address: 'मध्य प्रदेश' },
            'जबलपुर': { lat: 23.1815, lng: 79.9864, name: 'जबलपुर', address: 'मध्य प्रदेश' },
            'bhopal': { lat: 23.1815, lng: 77.4063, name: 'भोपाल', address: 'मध्य प्रदेश' },
            'भोपाल': { lat: 23.1815, lng: 77.4063, name: 'भोपाल', address: 'मध्य प्रदेश' },
            'tajmahal': { lat: 27.1751, lng: 78.0421, name: 'ताज महल', address: 'आगरा' },
            'taj mahal': { lat: 27.1751, lng: 78.0421, name: 'ताज महल', address: 'आगरा' },
            'ताज महल': { lat: 27.1751, lng: 78.0421, name: 'ताज महल', address: 'आगरा' },
            'agra': { lat: 27.1751, lng: 78.0421, name: 'आगरा', address: 'उत्तर प्रदेश' },
            'आगरा': { lat: 27.1751, lng: 78.0421, name: 'आगरा', address: 'उत्तर प्रदेश' },
            'hawa mahal': { lat: 26.9124, lng: 75.8262, name: 'हवा महल', address: 'जयपुर' },
            'हवा महल': { lat: 26.9124, lng: 75.8262, name: 'हवा महल', address: 'जयपुर' },
            'india gate': { lat: 28.6129, lng: 77.2295, name: 'इंडिया गेट', address: 'दिल्ली' },
            'इंडिया गेट': { lat: 28.6129, lng: 77.2295, name: 'इंडिया गेट', address: 'दिल्ली' },
            'gateway of india': { lat: 18.9220, lng: 72.8347, name: 'गेटवे ऑफ इंडिया', address: 'मुंबई' },
            'गेटवे ऑफ इंडिया': { lat: 18.9220, lng: 72.8347, name: 'गेटवे ऑफ इंडिया', address: 'मुंबई' },
            'parliament': { lat: 28.6274, lng: 77.1838, name: 'संसद भवन', address: 'दिल्ली' },
            'संसद': { lat: 28.6274, lng: 77.1838, name: 'संसद भवन', address: 'दिल्ली' },
            'red fort': { lat: 28.6561, lng: 77.2410, name: 'लाल किला', address: 'दिल्ली' },
            'लाल किला': { lat: 28.6561, lng: 77.2410, name: 'लाल किला', address: 'दिल्ली' },
            'varanasi': { lat: 25.3244, lng: 82.9856, name: 'वाराणसी', address: 'उत्तर प्रदेश' },
            'वाराणसी': { lat: 25.3244, lng: 82.9856, name: 'वाराणसी', address: 'उत्तर प्रदेश' },
            'benares': { lat: 25.3244, lng: 82.9856, name: 'वाराणसी', address: 'उत्तर प्रदेश' },
            'mathura': { lat: 27.4924, lng: 77.6737, name: 'मथुरा', address: 'उत्तर प्रदेश' },
            'मथुरा': { lat: 27.4924, lng: 77.6737, name: 'मथुरा', address: 'उत्तर प्रदेश' },
            'lucknow': { lat: 26.8467, lng: 80.9462, name: 'लखनऊ', address: 'उत्तर प्रदेश' },
            'लखनऊ': { lat: 26.8467, lng: 80.9462, name: 'लखनऊ', address: 'उत्तर प्रदेश' },
        };
        
        const result = Object.entries(searchResults).find(([key]) => 
            key.includes(query.toLowerCase())
        )?.[1];
        
        if (result) {
            this.showLocationDetails(result);
            this.map.setCenter(result.lat, result.lng);
            this.map.clearMarkers();
            this.map.addMarker(result.lat, result.lng, '📍', '#ff4444', result.name);
            this.addToHistory(result);
            this.showNotification(`✓ ${result.name} पाया गया`);
        } else {
            this.showNotification('❌ स्थान नहीं मिला', 'error');
        }
        
        document.getElementById('searchInput').value = '';
    }
    
    handleMapClick(coords) {
        const locationName = this.getLocationName(coords);
        const info = {
            lat: coords.lat,
            lng: coords.lng,
            name: locationName,
            address: `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`
        };
        
        this.showLocationDetails(info);
        this.map.clearMarkers();
        this.map.addMarker(coords.lat, coords.lng, '📍', '#4f46e5', info.name);
    }
    
    showLocationDetails(location) {
        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('sidebarContent');
        
        const isFavorite = this.favorites.some(fav => 
            fav.lat === location.lat && fav.lng === location.lng
        );
        
        content.innerHTML = `
            <div class="location-card">
                <div class="location-name">📍 ${location.name}</div>
                <div class="location-address">${location.address}</div>
                <div class="location-coords">${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E</div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button onclick="mapApp.addToFavorites(${location.lat}, ${location.lng}, '${location.name}')" 
                        style="flex: 1; padding: 8px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${isFavorite ? '⭐ पसंदीदा में है' : '☆ पसंदीदा जोड़ें'}
                    </button>
                    <button onclick="mapApp.shareLocation(${location.lat}, ${location.lng})" 
                        style="flex: 1; padding: 8px; background: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🔗 साझा करें
                    </button>
                </div>
            </div>
        `;
        
        sidebar.classList.remove('hidden');
    }
    
    closeSidebar() {
        document.getElementById('sidebar').classList.add('hidden');
    }
    
    openRoutePanel() {
        document.getElementById('routePanel').classList.add('active');
    }
    
    closeRoutePanel() {
        document.getElementById('routePanel').classList.remove('active');
    }
    
    swapLocations() {
        const from = document.getElementById('fromInput').value;
        const to = document.getElementById('toInput').value;
        document.getElementById('fromInput').value = to;
        document.getElementById('toInput').value = from;
    }
    
    findRoute() {
        const from = document.getElementById('fromInput').value.trim();
        const to = document.getElementById('toInput').value.trim();
        
        if (!from || !to) {
            this.showNotification('कृपया दोनों स्थान दर्ज करें', 'error');
            return;
        }
        
        const start = { lat: 28.6139, lng: 77.2090 };
        const end = { lat: 28.5355, lng: 77.3910 };
        
        const routePoints = [];
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            routePoints.push({
                lat: start.lat + (end.lat - start.lat) * t,
                lng: start.lng + (end.lng - start.lng) * t
            });
        }
        
        this.map.clearRoutes();
        this.map.addRoute(routePoints);
        
        const distance = this.calculateDistance(start.lat, start.lng, end.lat, end.lng);
        const time = (distance / 40).toFixed(1);
        
        const resultsDiv = document.getElementById('routeResults');
        resultsDiv.innerHTML = `
            <div style="margin-bottom: 12px;">
                <strong>📍 शुरुआत:</strong> ${from}<br>
                <strong>📍 गंतव्य:</strong> ${to}
            </div>
            <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                <div><strong>📏 दूरी:</strong> ${distance.toFixed(1)} किमी</div>
                <div><strong>⏱️ समय:</strong> ${time} घंटे</div>
            </div>
            <div class="route-step">
                <i class="fas fa-circle" style="color: #4f46e5;"></i>
                <span>${from} से शुरू करें</span>
            </div>
            <div class="route-step">
                <i class="fas fa-arrow-right" style="color: #4f46e5;"></i>
                <span>सीधे आगे जाएं ${distance.toFixed(1)} किमी तक</span>
            </div>
            <div class="route-step">
                <i class="fas fa-map-pin" style="color: #4f46e5;"></i>
                <span>${to} पर पहुंचें</span>
            </div>
        `;
        
        this.showNotification(`✓ मार्ग सफलतापूर्वक खोजा गया`);
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    getMyLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.map.setCenter(lat, lng);
                    this.map.clearMarkers();
                    this.map.addMarker(lat, lng, '📍', '#4f46e5', 'मेरी स्थिति');
                    this.showNotification('✓ आपकी स्थिति प्राप्त की गई');
                },
                () => {
                    this.showNotification('❌ स्थिति प्राप्त नहीं कर सके', 'error');
                }
            );
        } else {
            this.showNotification('❌ जियोलोकेशन समर्थित नहीं है', 'error');
        }
    }
    
    toggleMapType() {
        this.showNotification('🗺️ मानचित्र प्रकार बदल दिया गया');
    }
    
    addToFavorites(lat, lng, name) {
        if (!this.favorites.some(fav => fav.lat === lat && fav.lng === lng)) {
            this.favorites.push({ lat, lng, name });
            localStorage.setItem('mapFavorites', JSON.stringify(this.favorites));
            this.renderFavorites();
            this.showNotification(`⭐ ${name} पसंदीदा में जोड़ा गया`);
        } else {
            this.showNotification('यह पहले से पसंदीदा में है');
        }
    }
    
    removeFromFavorites(index) {
        const name = this.favorites[index].name;
        this.favorites.splice(index, 1);
        localStorage.setItem('mapFavorites', JSON.stringify(this.favorites));
        this.renderFavorites();
        this.showNotification(`⭐ ${name} पसंदीदा से हटाया गया`);
    }
    
    renderFavorites() {
        const list = document.getElementById('favoritesList');
        list.innerHTML = '';
        
        this.favorites.forEach((fav, index) => {
            const item = document.createElement('li');
            item.className = 'fav-item';
            item.innerHTML = `
                <span onclick="mapApp.map.setCenter(${fav.lat}, ${fav.lng}); mapApp.showLocationDetails({lat: ${fav.lat}, lng: ${fav.lng}, name: '${fav.name}', address: '${fav.lat.toFixed(4)}°N, ${fav.lng.toFixed(4)}°E'})">
                    ⭐ ${fav.name}
                </span>
                <i class="fas fa-trash" onclick="mapApp.removeFromFavorites(${index})"></i>
            `;
            list.appendChild(item);
        });
        
        if (this.favorites.length === 0) {
            list.innerHTML = '<li class="placeholder">कोई पसंदीदा नहीं</li>';
        }
    }
    
    addToHistory(location) {
        this.history.unshift(location);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem('mapHistory', JSON.stringify(this.history));
        this.renderHistory();
    }
    
    renderHistory() {
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        
        this.history.forEach((hist, index) => {
            const item = document.createElement('li');
            item.className = 'history-item';
            item.innerHTML = `
                <span onclick="mapApp.map.setCenter(${hist.lat}, ${hist.lng}); mapApp.showLocationDetails({lat: ${hist.lat}, lng: ${hist.lng}, name: '${hist.name}', address: '${hist.address}'})">
                    🕐 ${hist.name}
                </span>
                <i class="fas fa-times"></i>
            `;
            list.appendChild(item);
        });
        
        if (this.history.length === 0) {
            list.innerHTML = '<li class="placeholder">कोई इतिहास नहीं</li>';
        }
    }
    
    shareLocation(lat, lng) {
        const text = `मेरी स्थिति: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        if (navigator.share) {
            navigator.share({ title: 'मेरी स्थिति', text: text });
        } else {
            navigator.clipboard.writeText(text);
            this.showNotification('✓ स्थिति कॉपी की गई');
        }
    }
    
    switchTab(btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-tab');
        document.getElementById(tabName).classList.add('active');
    }
    
    toggleDarkMode(enabled) {
        this.isDarkMode = enabled;
        localStorage.setItem('darkMode', JSON.stringify(enabled));
        document.body.classList.toggle('dark-mode', enabled);
        this.map.darkMode = enabled;
        this.map.render();
        this.showNotification(enabled ? '🌙 डार्क मोड चालू' : '☀️ लाइट मोड चालू');
    }
    
    showNotification(message, type = 'success') {
        const notif = document.getElementById('notification');
        notif.textContent = message;
        notif.classList.add('show');
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 3000);
    }
    
    getLocationName(coords) {
        const locations = [
            { name: 'Delhi', lat: 28.6139, lng: 77.2090, radius: 0.5 },
            { name: 'Noida', lat: 28.5355, lng: 77.3910, radius: 0.3 },
            { name: 'Gurgaon', lat: 28.4089, lng: 77.3178, radius: 0.4 }
        ];
        
        for (let loc of locations) {
            const dist = Math.sqrt(Math.pow(coords.lat - loc.lat, 2) + Math.pow(coords.lng - loc.lng, 2));
            if (dist < loc.radius) {
                return loc.name;
            }
        }
        
        return `स्थान (${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°)`;
    }
    
    loadUIState() {
    }
}

let mapApp;
document.addEventListener('DOMContentLoaded', () => {
    mapApp = new MapApp();
});
