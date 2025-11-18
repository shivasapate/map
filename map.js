// Map Engine - Handles rendering and interactions
class MapEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Map state
        this.centerLat = 28.6139; // Delhi coordinates
        this.centerLng = 77.2090;
        this.zoom = 12;
        this.minZoom = 1;
        this.maxZoom = 20;
        
        // Markers
        this.markers = [];
        this.routes = [];
        
        // User interaction
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.pixelOffset = { x: 0, y: 0 };
        
        // Settings
        this.showTraffic = false;
        this.satelliteView = false;
        this.darkMode = false;
        
        // Sample markers
        this.initializeSampleMarkers();
        
        this.bindEvents();
        this.render();
    }
    
    setupCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
    }
    
    onMouseMove(e) {
        if (this.isDragging) {
            const dx = (e.clientX - this.dragStart.x) / (256 * Math.pow(2, this.zoom - 1));
            const dy = (e.clientY - this.dragStart.y) / (256 * Math.pow(2, this.zoom - 1));
            
            this.centerLng -= dx;
            this.centerLat += dy;
            
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.render();
        }
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onClick(e) {
        if (!this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            
            const coords = this.pixelToCoords(canvasX, canvasY);
            this.onMapClick(coords);
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -1 : 1;
        this.setZoom(this.zoom + zoomDelta);
    }
    
    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.render();
    }
    
    pixelToCoords(pixelX, pixelY) {
        const tileSize = 256 * Math.pow(2, this.zoom - 1);
        
        const centerX = (this.centerLng + 180) / 360 * tileSize;
        const centerY = (90 - this.centerLat) / 180 * tileSize;
        
        const mapCenterX = this.canvas.width / 2;
        const mapCenterY = this.canvas.height / 2;
        
        const deltaX = pixelX - mapCenterX;
        const deltaY = pixelY - mapCenterY;
        
        const worldX = centerX + deltaX;
        const worldY = centerY + deltaY;
        
        const lng = (worldX / tileSize) * 360 - 180;
        const lat = 90 - (worldY / tileSize) * 180;
        
        return { lat: Math.max(-90, Math.min(90, lat)), lng: Math.max(-180, Math.min(180, lng)) };
    }
    
    coordsToPixel(lat, lng) {
        const tileSize = 256 * Math.pow(2, this.zoom - 1);
        
        const centerX = (this.centerLng + 180) / 360 * tileSize;
        const centerY = (90 - this.centerLat) / 180 * tileSize;
        
        const x = (lng + 180) / 360 * tileSize;
        const y = (90 - lat) / 180 * tileSize;
        
        const pixelX = this.canvas.width / 2 + (x - centerX);
        const pixelY = this.canvas.height / 2 + (y - centerY);
        
        return { x: pixelX, y: pixelY };
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.satelliteView ? '#333' : this.darkMode ? '#1a1a1a' : '#e8f4f8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid/background
        this.drawMapBackground();
        
        // Draw routes
        this.drawRoutes();
        
        // Draw markers
        this.drawMarkers();
        
        // Update map info
        this.updateMapInfo();
    }
    
    drawMapBackground() {
        const tileSize = 50;
        this.ctx.strokeStyle = this.darkMode ? '#333' : '#d0e8f2';
        this.ctx.lineWidth = 1;
        
        const startX = Math.floor((this.canvas.width / 2 - this.centerLng * 1000) / tileSize) * tileSize;
        const startY = Math.floor((this.canvas.height / 2 - this.centerLat * 1000) / tileSize) * tileSize;
        
        for (let x = startX; x < this.canvas.width; x += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < this.canvas.height; y += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Add some location names
        this.drawLocationLabels();
    }
    
    drawLocationLabels() {
        this.ctx.fillStyle = this.darkMode ? '#aaa' : '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        const locations = [
            { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
            { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
            { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
            { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
            { name: 'Chennai', lat: 13.0827, lng: 80.2707 }
        ];
        
        locations.forEach(loc => {
            const pixel = this.coordsToPixel(loc.lat, loc.lng);
            if (pixel.x > 0 && pixel.x < this.canvas.width && pixel.y > 0 && pixel.y < this.canvas.height) {
                this.ctx.fillText(loc.name, pixel.x, pixel.y - 15);
            }
        });
    }
    
    drawMarkers() {
        this.markers.forEach((marker, index) => {
            const pixel = this.coordsToPixel(marker.lat, marker.lng);
            
            if (pixel.x > 0 && pixel.x < this.canvas.width && pixel.y > 0 && pixel.y < this.canvas.height) {
                // Draw marker pin
                const size = marker.selected ? 14 : 10;
                
                // Marker shadow
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(pixel.x - size, pixel.y + size - 2, size * 2, 3);
                
                // Marker body
                this.ctx.fillStyle = marker.color || '#ff4444';
                this.ctx.beginPath();
                this.ctx.arc(pixel.x, pixel.y, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Marker border
                this.ctx.strokeStyle = marker.selected ? 'white' : 'rgba(255, 255, 255, 0.7)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Marker label
                if (marker.label) {
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(marker.label, pixel.x, pixel.y);
                }
            }
        });
    }
    
    drawRoutes() {
        this.ctx.strokeStyle = '#4f46e5';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        this.routes.forEach(route => {
            this.ctx.beginPath();
            
            route.points.forEach((point, index) => {
                const pixel = this.coordsToPixel(point.lat, point.lng);
                
                if (index === 0) {
                    this.ctx.moveTo(pixel.x, pixel.y);
                } else {
                    this.ctx.lineTo(pixel.x, pixel.y);
                }
            });
            
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }
    
    updateMapInfo() {
        const mapInfo = document.getElementById('mapInfo');
        if (mapInfo) {
            mapInfo.innerHTML = `
                <strong>📍 देशांतर:</strong> ${this.centerLat.toFixed(4)}°<br>
                <strong>📍 अक्षांश:</strong> ${this.centerLng.toFixed(4)}°<br>
                <strong>🔍 ज़ूम:</strong> ${this.zoom}
            `;
        }
    }
    
    addMarker(lat, lng, label = '', color = '#ff4444', info = '') {
        const marker = { lat, lng, label, color, info, selected: false };
        this.markers.push(marker);
        this.render();
        return marker;
    }
    
    removeMarker(index) {
        this.markers.splice(index, 1);
        this.render();
    }
    
    clearMarkers() {
        this.markers = [];
        this.render();
    }
    
    addRoute(points) {
        this.routes.push({ points });
        this.render();
    }
    
    clearRoutes() {
        this.routes = [];
        this.render();
    }
    
    setCenter(lat, lng) {
        this.centerLat = lat;
        this.centerLng = lng;
        this.render();
    }
    
    getCenter() {
        return { lat: this.centerLat, lng: this.centerLng };
    }
    
    initializeSampleMarkers() {
        // Northern Region
        this.addMarker(28.6139, 77.2090, 'D', '#4f46e5', 'दिल्ली - भारत की राजधानी');
        this.addMarker(28.5355, 77.3910, 'N', '#ff6b6b', 'नोएडा');
        this.addMarker(28.4089, 77.3178, 'G', '#ffa500', 'गुड़गांव');
        this.addMarker(31.1704, 77.1811, 'S', '#22c55e', 'शिमला');
        this.addMarker(32.2140, 75.8410, 'D', '#06b6d4', 'धर्मशाला');
        this.addMarker(30.7333, 77.0667, 'R', '#ec4899', 'ऋषिकेश');
        this.addMarker(29.9457, 77.7770, 'N', '#8b5cf6', 'नोएडा');
        
        // Western Region
        this.addMarker(19.0760, 72.8777, 'M', '#ef4444', 'मुंबई - आर्थिक राजधानी');
        this.addMarker(21.1458, 79.0882, 'N', '#f97316', 'नागपुर');
        this.addMarker(23.1815, 79.9864, 'I', '#f59e0b', 'इंदौर');
        this.addMarker(22.3039, 73.1883, 'U', '#eab308', 'उज्जैन');
        this.addMarker(21.7645, 72.8433, 'S', '#84cc16', 'सूरत');
        this.addMarker(23.0225, 72.5714, 'A', '#22c55e', 'अहमदाबाद');
        this.addMarker(22.5726, 75.8325, 'I', '#06b6d4', 'इंदौर');
        
        // Southern Region
        this.addMarker(12.9716, 77.5946, 'B', '#0ea5e9', 'बेंगलुरु - IT हब');
        this.addMarker(13.0827, 80.2707, 'C', '#3b82f6', 'चेन्नई');
        this.addMarker(17.3850, 78.4867, 'H', '#1e40af', 'हैदराबाद');
        this.addMarker(9.9312, 76.2673, 'K', '#06b6d4', 'कोच्चि');
        this.addMarker(13.3527, 74.7421, 'M', '#14b8a6', 'मैसूर');
        this.addMarker(11.8889, 79.8277, 'P', '#10b981', 'पांडिचेरी');
        this.addMarker(12.2958, 79.8711, 'T', '#059669', 'तिरुपति');
        
        // Eastern Region
        this.addMarker(22.5726, 88.3639, 'K', '#8b5cf6', 'कोलकाता');
        this.addMarker(25.5941, 85.1376, 'P', '#a78bfa', 'पटना');
        this.addMarker(24.7833, 93.9500, 'I', '#c084fc', 'इम्फाल');
        this.addMarker(23.1815, 92.4678, 'S', '#d8b4fe', 'सिलचर');
        this.addMarker(26.1445, 91.7362, 'G', '#e9d5ff', 'गुवाहाटी');
        
        // Central Region
        this.addMarker(23.1815, 79.9864, 'J', '#fca5a5', 'जबलपुर');
        this.addMarker(25.3176, 78.6353, 'B', '#f87171', 'भोपाल');
        this.addMarker(26.5124, 75.5735, 'J', '#ef4444', 'जयपुर');
        this.addMarker(27.1751, 78.0421, 'A', '#dc2626', 'आगरा - ताज महल');
        
        // Northern Plains
        this.addMarker(26.8124, 80.9055, 'L', '#fbbf24', 'लखनऊ');
        this.addMarker(25.3200, 82.9789, 'V', '#f59e0b', 'वाराणसी - धार्मिक नगर');
        this.addMarker(27.1767, 78.0081, 'M', '#f97316', 'मथुरा');
        this.addMarker(28.2380, 79.5941, 'M', '#fb923c', 'मेरठ');
        
        // Tourist Destinations
        this.addMarker(27.1751, 78.0421, 'T', '#fbbf24', 'ताज महल - आगरा');
        this.addMarker(26.9124, 75.8262, 'H', '#fcd34d', 'हवा महल - जयपुर');
        this.addMarker(25.3244, 82.9856, 'B', '#fde047', 'बनारस घाट');
        this.addMarker(28.6274, 77.1838, 'P', '#facc15', 'संसद भवन - दिल्ली');
        this.addMarker(28.6129, 77.2295, 'I', '#eab308', 'इंडिया गेट - दिल्ली');
        this.addMarker(18.9220, 72.8347, 'G', '#d97706', 'गेटवे ऑफ इंडिया - मुंबई');
    }
    
    onMapClick(coords) {
        // This will be handled by the app
        window.dispatchEvent(new CustomEvent('mapClicked', { detail: coords }));
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapEngine;
}
