// Geri sayım sayacını global scope'ta tut
let geriSayimInterval;

// API Anahtarımız (sadece vakitler için kullanılacak)
const API_KEY = "0kCzHMw8PCVAEwVkyFqGvR:6Hw0gYoQ1AmNDbhxvxa1m9"; 

// FİNAL: 81 İL LİSTESİ (LOKAL)
const TURKIYE_ILLERI = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", 
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", 
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", 
    "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", 
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", 
    "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", 
    "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", 
    "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", 
    "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", 
    "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", 
    "Karabük", "Kilis", "Osmaniye", "Düzce"
];


document.addEventListener('DOMContentLoaded', () => {

    // 1. HTML Elementlerini Seçmek
    const sehirSelect = document.getElementById('sehirler');
    const anlikSaat = document.getElementById('anlik-saat'); 
    const tarihBilgisi = document.getElementById('tarih-bilgisi');
    const sonrakiVakitIsim = document.getElementById('sonraki-vakit-isim');
    const kalanZaman = document.getElementById('kalan-zaman');
    const vakitP_elementleri = document.querySelectorAll('.kart p[data-vakit]');

    const vakitEslesme = {
        'imsak': 'İmsak',
        'gunes': 'Güneş',
        'ogle': 'Öğle',
        'ikindi': 'İkindi',
        'aksam': 'Akşam',
        'yatsi': 'Yatsı'
    };

    // API için Türkçe karakterleri dönüştüren fonksiyon (Değişiklik yok)
    function apiValueFormatla(ilAdi) {
        return ilAdi
            .toLocaleLowerCase('tr-TR') // Önce hepsini küçük harf yap
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c');
    }

    // GÜNCELLENDİ: İlleri lokal listeden yükle
    function illeriLokaldenYukle() {
        console.log("İller lokal listeden yükleniyor...");
        sehirSelect.innerHTML = ""; // "İller Yükleniyor..." seçeneğini temizle

        TURKIYE_ILLERI.forEach(ilAdi => {
            const option = document.createElement('option');
            const ilValue = apiValueFormatla(ilAdi);
            
            option.value = ilValue;
            option.textContent = ilAdi; 
            
            // GÜNCELLENDİ: Ankara'yı otomatik seçme kodunu buradan kaldırdık.
            // Bu seçimi artık "UYGULAMAYI BAŞLATMA" bölümü yapacak.
            
            sehirSelect.appendChild(option);
        });
        console.log("81 il başarıyla yüklendi.");
    }


    // 2. Ana Fonksiyon: API'den Veri Çekme (Değişiklik yok)
    async function vakitleriGetir(sehir) {
        
        const bugun = new Date();
        const bugununTarihi = bugun.toISOString().split('T')[0];
        const cacheKey = `vakitler_${sehir}_${bugununTarihi}`;

        try {
            const cacheliVeri = localStorage.getItem(cacheKey);
            if (cacheliVeri) {
                console.log(`${sehir} için veri önbellekten yüklendi.`);
                const data = JSON.parse(cacheliVeri); 
                ekranaBas(data.result);
                kalanSureyiHesapla(data.result);
                return; 
            }
        } catch (e) {
            console.error("Önbellek okunurken hata oluştu:", e);
        }

        console.log(`${sehir} için veri API'den çekiliyor...`);
        
        const url = `https://api.collectapi.com/pray/all?city=${sehir}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'authorization': `apikey ${API_KEY}`,
                    'content-type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API yanıt vermedi (Şehir: ${sehir}): ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.result) {
                ekranaBas(data.result);
                kalanSureyiHesapla(data.result);

                try {
                    localStorage.setItem(cacheKey, JSON.stringify(data)); 
                    console.log(`${sehir} için veri önbelleğe kaydedildi.`);
                } catch (e) {
                    console.error("Önbelleğe yazılırken hata oluştu:", e);
                }
            } else {
                console.error("API'den beklenen formatta veri gelmedi:", data);
            }
            
        } catch (error) {
            console.error("Veri çekerken hata oluştu:", error);
            alert(`Vakitler alınamadı. '${sehir}' için API desteği olmayabilir veya internet bağlantınızı kontrol edin.`);
        }
    }


    // 3. Veriyi Ekrana Basma Fonksiyonu (Değişiklik yok)
    function ekranaBas(vakitler) {
        vakitP_elementleri.forEach(p_elementi => {
            const dataVakitAdi = p_elementi.getAttribute('data-vakit'); 
            const apiVakitAdi = vakitEslesme[dataVakitAdi];
            const bulunanVakit = vakitler.find(v => v.vakit === apiVakitAdi);
            
            if (bulunanVakit) {
                p_elementi.textContent = bulunanVakit.saat;
            } else {
                p_elementi.textContent = "Hata";
            }
        });
    }


    // 4. Tarihi Güncelleme Fonksiyonu (Değişiklik yok)
    function tarihiGuncelle() {
        const bugun = new Date();
        const secenekler = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        tarihBilgisi.textContent = bugun.toLocaleDateString('tr-TR', secenekler);
    }

    // 5. Anlık Saati Güncelleme Fonksiyonu (Değişiklik yok)
    function saatiGuncelle() {
        const simdi = new Date();
        anlikSaat.textContent = simdi.toLocaleTimeString('tr-TR');
    }


    // 6. GÜNCELLENDİ: Olay Dinleyicisi (Şehri Hafızaya Alma)
    sehirSelect.addEventListener('change', () => {
        const secilenSehir = sehirSelect.value;
        
        // YENİ: Kullanıcının seçimini tarayıcının hafızasına kaydet
        localStorage.setItem('sonSecilenSehir', secilenSehir);
        console.log(`Yeni şehir hafızaya kaydedildi: ${secilenSehir}`);
        
        vakitleriGetir(secilenSehir);
    });


    // --- GÜNCELLENDİ: UYGULAMAYI BAŞLATMA (Hafızadan Okuma) ---
    
    tarihiGuncelle();
    saatiGuncelle();
    setInterval(saatiGuncelle, 1000); 

    // Önce 81 ili lokal listeden yükle (hiçbirini seçili yapmadan)
    illeriLokaldenYukle();
    
    // YENİ: Hafızadaki şehri kontrol et
    const kayitliSehir = localStorage.getItem('sonSecilenSehir');
    let baslangicSehri;

    if (kayitliSehir) {
        // Hafızada bir şehir varsa onu kullan
        baslangicSehri = kayitliSehir;
        console.log(`Hafızadan yüklenen şehir: ${baslangicSehri}`);
    } else {
        // Hafızada bir şehir yoksa (ilk ziyaret), Ankara'yı varsayılan yap
        baslangicSehri = 'ankara';
        console.log("İlk ziyaret, varsayılan şehir Ankara olarak ayarlandı.");
    }
    
    // Menüde doğru şehrin görünmesini sağla
    sehirSelect.value = baslangicSehri;

    // O şehrin vakitlerini getir
    vakitleriGetir(baslangicSehri);
    
    // --- Başlatma bitti ---


    
    // Geri Sayım Fonksiyonu (Değişiklik yok)
    function kalanSureyiHesapla(vakitler) {
        if (geriSayimInterval) clearInterval(geriSayimInterval);

        const simdiBase = new Date(); 
        const tumVakitler = vakitler.map(vakit => {
            const [saat, dakika] = vakit.saat.split(':');
            const vakitZamani = new Date(simdiBase.getFullYear(), simdiBase.getMonth(), simdiBase.getDate(), parseInt(saat), parseInt(dakika), 0);
            return { isim: vakit.vakit, zaman: vakitZamani };
        });

        function sayaciGuncelle() {
            const simdi = new Date(); 
            let sonrakiVakit = tumVakitler.find(v => v.zaman > simdi);

            if (!sonrakiVakit) {
                const yarinImsakZamani = new Date(tumVakitler[0].zaman);
                yarinImsakZamani.setDate(yarinImsakZamani.getDate() + 1); 
                sonrakiVakit = { isim: tumVakitler[0].isim, zaman: yarinImsakZamani };
            }

            const farkMs = sonrakiVakit.zaman.getTime() - simdi.getTime();
            const toplamSaniye = Math.floor(farkMs / 1000);
            const saat = Math.floor(toplamSaniye / 3600);
            const dakika = Math.floor((toplamSaniye % 3600) / 60);
            const saniye = toplamSaniye % 60;

            sonrakiVakitIsim.textContent = sonrakiVakit.isim;
            kalanZaman.textContent = `${saat.toString().padStart(2, '0')}:${dakika.toString().padStart(2, '0')}:${saniye.toString().padStart(2, '0')}`;
        }
        sayaciGuncelle(); 
        geriSayimInterval = setInterval(sayaciGuncelle, 1000);
    }

}); // DOMContentLoaded sonu
