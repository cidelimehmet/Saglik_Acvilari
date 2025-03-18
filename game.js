// Oyun değişkenleri
let canvas, ctx;
let score = 0;
let gameRunning = false;
let character; // sepet yerine karakter kullanacağız
let items = [];
let lastTime = 0;
let spawnInterval = 1500; // ms cinsinden yiyeceklerin düşme sıklığı
let lastSpawnTime = 0;
let gameSpeed = 1;

// Pause kontrolü
let gamePaused = false;

// Karakter ifadeleri
const EXPRESSIONS = {
    NORMAL: 'normal',
    HAPPY: 'happy',
    DISGUSTED: 'disgusted',
    EXCITED: 'excited'
};

// Animasyon kontrolü
let characterExpression = EXPRESSIONS.NORMAL;
let expressionTimer = 0;
let eatingAnimation = false;
let eatingTimer = 0;
const EXPRESSION_DURATION = 1000; // İfade süresi (ms)
const EATING_DURATION = 300; // Yeme animasyonu süresi (ms)

// Yiyecek çeşitleri - resim yerine renk ve şekil kullanacağız
const FOODS = [
    // Sağlıklı yiyecekler
    { name: 'elma', color: '#ff0000', shape: 'circle', points: 10, healthy: true },
    { name: 'portakal', color: '#ff8800', shape: 'circle', points: 10, healthy: true },
    { name: 'muz', color: '#ffff00', shape: 'rectangle', points: 15, healthy: true },
    { name: 'çilek', color: '#ff0044', shape: 'triangle', points: 20, healthy: true },
    { name: 'havuç', color: '#ff8800', shape: 'triangle', points: 15, healthy: true },
    
    // Özel sağlık objesi - serum
    { name: 'serum', color: '#00aaff', shape: 'serum', points: 50, healthy: true, special: true },
    
    // Zararlı yiyecekler
    { name: 'hamburger', color: '#8B4513', shape: 'burger', points: -15, healthy: false },
    { name: 'kızartma', color: '#FFD700', shape: 'fries', points: -10, healthy: false },
    { name: 'çikolata', color: '#4B0082', shape: 'rectangle', points: -5, healthy: false },
    { name: 'gazlı_içecek', color: '#8B0000', shape: 'soda', points: -20, healthy: false }
];

// Yıldız ve ilerleme sistemi için değişkenler
const STAR_THRESHOLDS = [100, 250, 500]; // Yıldız kazanma eşikleri
let earnedStars = 0;

// Oyunu başlatma
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('play-again-button').addEventListener('click', startGame);

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Canvas boyutunu ayarla
    resizeCanvas();
    
    // Oyun değişkenlerini sıfırla
    score = 0;
    earnedStars = 0;
    characterExpression = EXPRESSIONS.NORMAL;
    document.getElementById('score').innerText = `Puan: ${score}`;
    gameRunning = true;
    items = [];
    lastSpawnTime = 0;
    gameSpeed = 1;
    
    // Pause durumunu sıfırla
    gamePaused = false;
    document.getElementById('pause-screen').style.display = 'none';
    
    // Yıldızları ve ilerleme çubuğunu sıfırla
    updateProgressBar(0);
    updateStars(0);
    
    // Karakter özellikleri (sepet yerine) - karakteri daha büyük yapıyoruz
    character = {
        x: canvas.width / 2 - 60,
        y: canvas.height - 150, // Daha yukarı konumlandıralım ki ekranda daha çok yer kaplasın
        width: 120,  // Genişliği artırıldı
        height: 160, // Yüksekliği artırıldı
        expression: EXPRESSIONS.NORMAL,
        isEating: false
    };
    
    // Fare ve dokunmatik olayları
    canvas.addEventListener('mousemove', moveCharacter);
    canvas.addEventListener('touchmove', moveCharacterTouch);
    
    // Oyun döngüsünü başlat
    requestAnimationFrame(gameLoop);
}

// Pause ve resume işlevleri
function pauseGame() {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
        document.getElementById('pause-screen').style.display = 'flex';
    }
}

function resumeGame() {
    if (gameRunning && gamePaused) {
        gamePaused = false;
        document.getElementById('pause-screen').style.display = 'none';
        
        // Oyun döngüsünü yeniden başlat - son zamanı sıfırla ki animasyonlar düzgün çalışsın
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

// Pause ve resume butonlarını dinle
document.getElementById('pause-button').addEventListener('click', pauseGame);
document.getElementById('resume-button').addEventListener('click', resumeGame);

// ESC tuşu ile de oyunu duraklatma
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
        if (gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Karakter varsa, ekran yeniden boyutlandırıldığında karakterin konumunu güncelle
    if (character) {
        character.y = canvas.height - 150; // Daha yukarıda konumlandırma
    }
}

function moveCharacter(e) {
    // Oyun duraklatılmışsa fare hareketini göz ardı et
    if (!gameRunning || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    character.x = e.clientX - rect.left - character.width / 2;
    
    // Ekrandan çıkmasını engelle
    if (character.x < 0) character.x = 0;
    if (character.x + character.width > canvas.width) character.x = canvas.width - character.width;
}

function moveCharacterTouch(e) {
    // Oyun duraklatılmışsa dokunma hareketini göz ardı et
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        character.x = e.touches[0].clientX - rect.left - character.width / 2;
        
        // Ekrandan çıkmasını engelle
        if (character.x < 0) character.x = 0;
        if (character.x + character.width > canvas.width) character.x = canvas.width - character.width;
    }
}

function spawnItem() {
    let randomFood;
    
    // Serumun nadiren çıkması için özel kontrol (%2 olasılık)
    const serumChance = 0.02;
    
    if (Math.random() < serumChance) {
        // Serum objesi
        randomFood = FOODS.find(food => food.name === 'serum');
    } else {
        // Zararlı yiyeceklerin çıkma olasılığını artırma
        // Puan arttıkça zararlı yiyecekler daha sık çıkar
        const unhealthyChance = Math.min(0.5, 0.2 + score / 300); // %20 ile %50 arası olasılık
        
        if (Math.random() < unhealthyChance) {
            // Zararlı yiyeceklerden birini seç
            const unhealthyFoods = FOODS.filter(food => !food.healthy);
            randomFood = unhealthyFoods[Math.floor(Math.random() * unhealthyFoods.length)];
        } else {
            // Sağlıklı yiyeceklerden birini seç (serum hariç)
            const healthyFoods = FOODS.filter(food => food.healthy && !food.special);
            randomFood = healthyFoods[Math.floor(Math.random() * healthyFoods.length)];
        }
    }
    
    const size = 60 + Math.random() * 20; // Rastgele boyut (60-80 arası)
    
    items.push({
        x: Math.random() * (canvas.width - size),
        y: -size, // Ekranın üstünden başla
        width: size,
        height: size,
        speed: (2 + Math.random() * 3) * gameSpeed, // Rastgele hız
        food: randomFood,
        rotation: Math.random() * 360 // Rastgele döndürme açısı
    });
}

function updateGame(deltaTime) {
    // İfade zamanlayıcıyı güncelle
    if (characterExpression !== EXPRESSIONS.NORMAL) {
        expressionTimer += deltaTime;
        if (expressionTimer >= EXPRESSION_DURATION) {
            characterExpression = EXPRESSIONS.NORMAL;
            expressionTimer = 0;
        }
    }
    
    // Yeme animasyonu zamanlayıcısı
    if (eatingAnimation) {
        eatingTimer += deltaTime;
        if (eatingTimer >= EATING_DURATION) {
            eatingAnimation = false;
            eatingTimer = 0;
        }
    }

    // Yeni yiyecek ekleme
    if (Date.now() - lastSpawnTime > spawnInterval) {
        spawnItem();
        lastSpawnTime = Date.now();
        
        // Oyun ilerledikçe zorlaşsın
        spawnInterval = Math.max(500, spawnInterval - 10);
        gameSpeed += 0.001;
    }
    
    // Yiyecekleri güncelle
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;
        item.rotation += 1; // Dönme animasyonu
        
        // Karakter ile çarpışma kontrolü
        if (checkCollision(character, item)) {
            // Yakalandı - yeme animasyonu başlat
            eatingAnimation = true;
            eatingTimer = 0;
            
            // Puan güncelleme
            score += item.food.points;
            document.getElementById('score').innerText = `Puan: ${score}`;
            
            // İlerleme çubuğunu ve yıldız sistemini güncelle
            updateProgressBar(score);
            updateStars(score);
            
            // İfade güncelleme
            if (item.food.healthy) {
                // Sağlıklı yiyecek - mutlu ifade
                if (item.food.special) {
                    // Serum - çok mutlu/heyecanlı
                    characterExpression = EXPRESSIONS.EXCITED;
                    flashScreen('#00ffff', 0.3);
                } else {
                    // Normal sağlıklı yiyecek
                    characterExpression = EXPRESSIONS.HAPPY;
                    flashScreen('#00ff00', 0.2);
                }
            } else {
                // Zararlı yiyecek - tiksinme/üzgün ifade
                characterExpression = EXPRESSIONS.DISGUSTED;
                flashScreen('#ff0000', 0.2);
                
                // Puan çok düştüyse oyunu bitir
                if (score <= 0) {
                    endGame();
                }
            }
            
            // İfade zamanlayıcıyı sıfırla
            expressionTimer = 0;
            
            // Yakalanan öğeyi kaldır
            items.splice(i, 1);
        }
        // Ekrandan çıktı mı?
        else if (item.y > canvas.height) {
            // Sağlıklı yiyecek kaçırıldı mı?
            if (item.food.healthy) {
                // Sağlıklı yiyeceği kaçırınca puan kaybı
                score -= 5;
                document.getElementById('score').innerText = `Puan: ${score}`;
                
                // Görsel geri bildirim
                flashScreen('#ff0000', 0.3);
                
                // Eğer puanımız 0 veya altına düştüyse oyunu bitir
                if (score <= 0) {
                    endGame();
                }
            }
            
            items.splice(i, 1);
        }
    }
}

// İlerleme çubuğunu güncelleyen fonksiyon
function updateProgressBar(currentScore) {
    const maxScore = STAR_THRESHOLDS[STAR_THRESHOLDS.length - 1];
    const progressFill = document.getElementById('progress-fill');
    const percentage = Math.min(100, (currentScore / maxScore) * 100);
    
    progressFill.style.width = percentage + '%';
}

// Yıldız sistemini güncelleyen fonksiyon
function updateStars(currentScore) {
    let newEarnedStars = 0;
    
    // Kaç yıldız kazanıldığını hesapla
    for (let i = 0; i < STAR_THRESHOLDS.length; i++) {
        if (currentScore >= STAR_THRESHOLDS[i]) {
            newEarnedStars = i + 1;
        } else {
            break;
        }
    }
    
    // Yeni yıldız kazanıldığında animasyon göster
    if (newEarnedStars > earnedStars) {
        earnedStars = newEarnedStars;
        
        // Yıldızları güncelle
        for (let i = 1; i <= 3; i++) {
            const star = document.getElementById('star' + i);
            if (i <= earnedStars) {
                if (!star.classList.contains('active')) {
                    star.classList.add('active');
                    
                    // Yeni yıldız animasyonu
                    setTimeout(() => {
                        flashScreen('rgba(255, 215, 0, 0.3)', 0.4); // Altın rengi flash
                    }, 200);
                }
            } else {
                star.classList.remove('active');
            }
        }
    }
}

// Ekranda anlık bir renk parlaması için
function flashScreen(color, opacity) {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
}

function checkCollision(character, item) {
    // Kafanın üstünde bir algılama alanı oluştur (yiyecekleri ağızla yakalamak için)
    const catchArea = {
        x: character.x + character.width / 4,
        y: character.y,
        width: character.width / 2,
        height: character.height / 3
    };
    
    return catchArea.x < item.x + item.width &&
           catchArea.x + catchArea.width > item.x &&
           catchArea.y < item.y + item.height &&
           catchArea.y + catchArea.height > item.y;
}

function drawGame() {
    // Ekranı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Arkaplanı çiz
    ctx.fillStyle = '#e6f7ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Karakteri çiz
    drawCharacter(character);
    
    // Düşen yiyecekleri çiz
    items.forEach(item => {
        drawFoodItem(item);
    });
}

// Karakteri çizen fonksiyon (sepet yerine)
function drawCharacter(character) {
    ctx.save();
    
    const x = character.x;
    const y = character.y;
    const width = character.width;
    const height = character.height;
    
    // Vücut
    ctx.fillStyle = '#FFB6C1'; // Pembe tişört
    ctx.fillRect(x + width/4, y + height/3, width/2, height/2);
    
    // Kafa - ölçek büyütüldü
    ctx.fillStyle = '#FFDAB9'; // Ten rengi
    ctx.beginPath();
    ctx.arc(x + width/2, y + height/4, width/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Saç
    ctx.fillStyle = '#8B4513'; // Kahverengi saç
    ctx.beginPath();
    ctx.arc(x + width/2, y + height/4 - 10, width/4, Math.PI, 0, true);
    ctx.fill();
    
    // Kol (sol)
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(x + width/6, y + height/3, width/6, height/3);
    
    // Kol (sağ)
    ctx.fillRect(x + width*2/3, y + height/3, width/6, height/3);
    
    // Bacaklar
    ctx.fillStyle = '#6495ED'; // Mavi pantolon
    ctx.fillRect(x + width/3, y + height*5/6 - 10, width/3, height/6);
    
    // İfadeye göre yüz çiz - burada EXPRESSIONS değil expression parametre olarak geçirilmeli
    drawFace(x + width/2, y + height/4, width/4, characterExpression, eatingAnimation);
    
    ctx.restore();
}

// Yüz ifadesini çizen fonksiyon
function drawFace(x, y, size, expression, eating) {
    // Gözler
    const eyeSize = size / 6;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - size/3, y - size/6, eyeSize, 0, Math.PI * 2);
    ctx.arc(x + size/3, y - size/6, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Göz bebekleri
    ctx.fillStyle = '#000000';
    let pupilOffset = 0;
    
    if (expression === EXPRESSIONS.EXCITED) {
        // Heyecanlı ifade - gözler yıldız şeklinde
        drawStar(x - size/3, y - size/6, eyeSize/2, '#FFD700');
        drawStar(x + size/3, y - size/6, eyeSize/2, '#FFD700');
    } else {
        // Normal göz bebekleri
        if (expression === EXPRESSIONS.DISGUSTED) {
            pupilOffset = -1; // Gözler yukarı bakıyor
        }
        
        ctx.beginPath();
        ctx.arc(x - size/3, y - size/6 + pupilOffset, eyeSize/2, 0, Math.PI * 2);
        ctx.arc(x + size/3, y - size/6 + pupilOffset, eyeSize/2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Ağız
    ctx.fillStyle = '#000000';
    
    if (eating) {
        // Yeme animasyonu - ağız açık
        ctx.beginPath();
        ctx.arc(x, y + size/3, size/3, 0, Math.PI, false);
        ctx.fill();
    } else {
        switch(expression) {
            case EXPRESSIONS.NORMAL:
                // Normal ifade - düz ağız
                ctx.beginPath();
                ctx.moveTo(x - size/3, y + size/3);
                ctx.lineTo(x + size/3, y + size/3);
                ctx.stroke();
                break;
                
            case EXPRESSIONS.HAPPY:
                // Mutlu ifade - gülümseyen ağız
                ctx.beginPath();
                ctx.arc(x, y + size/4, size/3, 0, Math.PI, false);
                ctx.stroke();
                break;
                
            case EXPRESSIONS.DISGUSTED:
                // Tiksinme ifadesi - kıvrık ağız
                ctx.beginPath();
                ctx.moveTo(x - size/3, y + size/3);
                ctx.quadraticCurveTo(x, y + size/1.8, x + size/3, y + size/3);
                ctx.stroke();
                break;
                
            case EXPRESSIONS.EXCITED:
                // Heyecanlı ifade - büyük gülümseyen ağız
                ctx.beginPath();
                ctx.arc(x, y + size/4, size/2.5, 0, Math.PI, false);
                ctx.stroke();
                
                // Dişler
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x - size/4, y + size/6, size/2, size/8);
                break;
        }
    }
}

// Yıldız çizme fonksiyonu (heyecanlı ifade için)
function drawStar(cx, cy, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size + cx,
                  Math.sin((18 + i * 72) * Math.PI / 180) * size + cy);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * size/2 + cx,
                  Math.sin((54 + i * 72) * Math.PI / 180) * size/2 + cy);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawFoodItem(item) {
    ctx.save();
    
    // Ortala ve döndür
    ctx.translate(item.x + item.width/2, item.y + item.height/2);
    ctx.rotate(item.rotation * Math.PI / 180);
    
    const halfW = item.width/2;
    const halfH = item.height/2;
    
    ctx.fillStyle = item.food.color;
    
    switch(item.food.shape) {
        case 'circle':
            // Elma veya portakal gibi yuvarlak meyveler
            ctx.beginPath();
            ctx.arc(0, 0, halfW, 0, Math.PI * 2);
            ctx.fill();
            
            // Sap ekleme
            if (item.food.name === 'elma') {
                ctx.fillStyle = '#663300';
                ctx.fillRect(-2, -halfH, 4, 10);
                
                // Yaprak
                ctx.fillStyle = '#00AA00';
                ctx.beginPath();
                ctx.ellipse(5, -halfH + 5, 7, 5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
            
        case 'rectangle':
            // Muz veya çikolata
            if (item.food.name === 'muz') {
                ctx.fillStyle = item.food.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, halfW, halfH/2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Muzun uçları
                ctx.fillStyle = '#886600';
                ctx.beginPath();
                ctx.arc(-halfW + 5, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (item.food.name === 'çikolata') {
                // Çikolata çiz
                ctx.fillRect(-halfW, -halfH/1.5, halfW*2, halfH/0.8);
                
                // Çikolata detayları
                ctx.strokeStyle = '#310062';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-halfW/2, -halfH/1.5);
                ctx.lineTo(-halfW/2, halfH/2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(halfW/2, -halfH/1.5);
                ctx.lineTo(halfW/2, halfH/2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-halfW, -halfH/3);
                ctx.lineTo(halfW, -halfH/3);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-halfW, halfH/6);
                ctx.lineTo(halfW, halfH/6);
                ctx.stroke();
            }
            break;
            
        case 'triangle':
            // Çilek veya havuç
            if (item.food.name === 'çilek') {
                // Çilek - kalp şeklinde
                ctx.beginPath();
                ctx.moveTo(0, halfH - 5);
                ctx.bezierCurveTo(halfW, -halfH, halfW, -halfH, 0, -5);
                ctx.bezierCurveTo(-halfW, -halfH, -halfW, -halfH, 0, halfH - 5);
                ctx.fill();
                
                // Çilek çekirdekleri
                ctx.fillStyle = '#FFFF00';
                for (let i = 0; i < 8; i++) {
                    const dotX = (Math.random() - 0.5) * halfW;
                    const dotY = (Math.random() - 0.5) * halfH;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Havuç
                ctx.beginPath();
                ctx.moveTo(0, -halfH);
                ctx.lineTo(-halfW, halfH);
                ctx.lineTo(halfW, halfH);
                ctx.closePath();
                ctx.fill();
                
                // Havuç yeşilliği
                ctx.fillStyle = '#00AA00';
                ctx.beginPath();
                ctx.ellipse(0, -halfH, halfW/2, 10, 0, 0, Math.PI);
                ctx.fill();
            }
            break;
            
        case 'burger':
            // Hamburger
            // Alt ekmek
            ctx.fillStyle = '#D2691E';
            ctx.beginPath();
            ctx.ellipse(0, halfH/2, halfW, halfH/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Köfte
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(0, 0, halfW, halfH/5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Peynir
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-halfW, -halfH/5, halfW*2, halfH/10);
            
            // Üst ekmek
            ctx.fillStyle = '#D2691E';
            ctx.beginPath();
            ctx.ellipse(0, -halfH/2, halfW, halfH/4, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'fries':
            // Patates kızartması
            // Paket
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(-halfW/1.2, -halfH/2, halfW*2/1.2, halfH);
            
            // Patatesler
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 7; i++) {
                const fryX = (i-3) * halfW/4;
                ctx.fillRect(fryX, -halfH, halfW/8, halfH*1.2);
            }
            break;
            
        case 'soda':
            // Gazlı içecek
            // Şişe
            ctx.fillStyle = item.food.color;
            ctx.fillRect(-halfW/2, -halfH, halfW, halfH*2);
            
            // Etiket
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-halfW/2, -halfH/3, halfW, halfH/2);
            
            // Kapak
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(-halfW/3, -halfH-5, halfW*2/3, halfH/5);
            break;
            
        case 'serum':
            // Serum çizimi
            // Serum şişesi (şeffaf kısım)
            ctx.fillStyle = 'rgba(220, 240, 255, 0.7)';
            ctx.fillRect(-halfW/3, -halfH, halfW*2/3, halfH*1.5);
            
            // Serumun sıvı kısmı
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(-halfW/3, -halfH, halfW*2/3, halfH*0.8);
            
            // Serum tüpü
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -halfH);
            ctx.lineTo(0, halfH*1.2);
            ctx.stroke();
            
            // Serum askısı
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(-halfW/2, -halfH-10, halfW, 10);
            
            // Parlak efekti
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(-halfW/6, -halfH/2, halfW/10, halfH/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            break;
    }
    
    // Zararlı yiyecek işareti (çarpı)
    if (!item.food.healthy) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-halfW/1.3, -halfH/1.3);
        ctx.lineTo(halfW/1.3, halfH/1.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(halfW/1.3, -halfH/1.3);
        ctx.lineTo(-halfW/1.3, halfH/1.3);
        ctx.stroke();
    }
    
    // Serum için özel parlak efekt
    if (item.food.name === 'serum') {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, halfW + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, halfW + 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // Oyun duraklatılmışsa döngüyü durdur
    if (gamePaused) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    updateGame(deltaTime);
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    document.getElementById('final-score').innerText = score;
    
    // Son yıldız durumunu güncelle
    for (let i = 1; i <= 3; i++) {
        const finalStar = document.getElementById('final-star' + i);
        if (i <= earnedStars) {
            finalStar.classList.add('active');
        } else {
            finalStar.classList.remove('active');
        }
    }
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'flex';
    
    // Olayları kaldır
    canvas.removeEventListener('mousemove', moveCharacter);
    canvas.removeEventListener('touchmove', moveCharacterTouch);
}

// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener('resize', resizeCanvas);
