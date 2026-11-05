# Para/yetki mantığında hata sınıfları kataloğu

Gerçek bir projede (bahis/bonus/çekim platformu) bulunan hatalardan derlendi. Her sınıf için neye bakılacağı ve nasıl test edileceği.

## Bulunan sınıflar (örneklerle)

| Sınıf | Örnek | Nasıl yakalanır |
|---|---|---|
| **TX-ABORT** Postgres transaction'ının ikinci hatada düşmesi (25P02) | Kapalı döneme gelen 2. kredi benzersiz anahtar çakışması yapıp tüm işlemi düşürdü, kazanç sonsuza kadar 500 | Gerçek DB'de olay tekrarı / ikinci kredi senaryosu |
| **STATE-STAMP** Durum damgası ilk olayda yazılıp sonrakilerde atlanması | İlk bahsi nakit olan turda ikinci bonus-fonlu bahis döneme bağlanmadı → kazanç sahipsiz | Karma (nakit+bonus) tur dizileri, model-DB karşılaştırması |
| **CAP-LEAK** Tavanın bir yoldan atlanması | Kapanmış dönemin geç kazancı `maxConvert` tavanını aştı (100 TL bonus, 500 TL tavan → 5000 TL nakit) | Kapanıştan SONRA gelen olaylar, her kapanış sebebi için |
| **REVERSAL-ASYM** Geri alma, ileri işlemden büyük/küçük | İptal edilen nakit bahis çevrim ilerlemesini tüm stake kadar düşürdü, oysa ilerleme tavanlanmıştı | ileri+geri çiftleri; "ne kadar yazıldıysa o kadar geri alınır" değişmezi |
| **FLOAT-ROUND** Ondalık çarpanlarda float | 50 × 1.15 → 57 | kesin rasyonel aritmetik testi, sınır değerleri |
| **BOUND-ORDER** Alt/üst sınır sırası | `min_bonus_amount > maxBonus` bonusu tavanın üstüne çıkardı | Parametre uzayını rastgele tara (min>max dahil) |
| **DOUBLE-PAY** İki mekanizma aynı ödülü iki kez verir | Çekiliş ödülü + bilet iadesi | Her ödeme türü çifti için karşılıklı dışlama testi |
| **POOL-STARVE** Bağlantı havuzunun kilit beklerken tükenmesi | Transfer içinde global client ile okuma; 10 eşzamanlıdan 9'u 503 | Küçük havuzla eşzamanlılık testi |
| **UNCHECKED-COUNT** `updateMany` etkilenen satır sayısını denetlememek | Bayat bakiye ile nakit yaratılabilirdi | `count !== 1` ise hata ve rollback |
| **ZOMBIE-FIELD** Modelde olmayan alana yazan kod | `failedAt/externalId` olmayan kolona yazım → her geri çağrı 500 | tsc + gerçek DB'de rota çağrısı |
| **ENV-DEP** Test ortamı bağımlılığı | CI'da DB'siz kırılan test, yerelde geçiyor | Temiz ortamda (CI) koşu |
| **MERGE-SEMANTIC** İki doğru değişikliğin birleşince yanlış olması | Referral komisyonu bekletme kararı eski bir testi kırdı | Birleşik daldan tam suite |
| **CHECK-BEFORE-LOCK** (TOCTOU) | Ödül/iade dışlaması kilitten önce karar verildi, eşzamanlı ikisi de ödendi (25 denemede 24) | Karşıt iki işlemi `Promise.all` ile 20+ kez; her karşılıklı-dışlama kontrolünün kilitten SONRA olduğunu doğrula |
| **KILL-SWITCH-PARTIAL** | Bir ayar yalnız tek yolda uygulanıyor | Ayarı kapat, ilgili HER para yolunu çalıştır |
| **SERVICE-PRECONDITION-GAP** | Doğrulama yalnız HTTP rotasında, servis 0/negatif kabul ediyor | Servisi doğrudan 0, -1, NaN, 0.005, Infinity ile çağır |
| **UNLEDGERED-CREDIT** | Defter satırı/idempotency'siz bakiye artıran metot veya betik | "Çağıranı olmayan servis metodu" + kök dizin betikleri taraması |
| **TURNOVER-REVERSAL** | Çevrim/eşik, geri alınan işlemi sayıyor | Her çevrim kaynağı için alım→iade→eşik dizisi |

## Saldırı stratejileri (her projede sırayla dene)
1. Aynı işlemi iki kez gönder (replay) ve eşzamanlı gönder.
2. Sıra bozuk olay: iade önce, bahis sonra; kapanıştan sonra kazanç.
3. Kenar değerler: 0, 1, en küçük bahis, tavan-1, tavan, tavan+1, MAX safe integer, BigInt sınırları.
4. İki taraflı bahis (hedge), düşük oran spamı, yatır-oyna-iptal döngüsü.
5. Aktifken yeni talep, havuzlar arası transfer ile limit aşma.
6. Parametre uzayı: çelişkili konfigürasyonlar (min>max, çarpan 0, yüzde 0/100+).
7. Yetki: aynı admin kendi işlemini onaylar mı, yetkisiz rota, süresi dolmuş oturum.
8. Dış sistem hatası: gateway/Redis/DB zaman aşımı sırasında yarım kalan durum.

## Değişmez (invariant) şablonları
- Hiçbir bakiye negatif olmaz.
- Defter toplamı = cüzdan sütunları (havuz bazında).
- bekleyen + kilitli + ödenmiş toplamı sabit.
- Oyuncunun çekebileceği toplam <= yatırımlar + izin verilen dönüştürülmüş kazanç.
- Sayaçlar (çevrim) yalnızca açık geri almalarda azalır.
- Aynı idempotency anahtarı tekrar çalışınca durum değişmez.
- Kapalı/terminal durum yeniden açılmaz.
- Tavanlar hiçbir yoldan (geç olay, iade, admin) aşılmaz.
