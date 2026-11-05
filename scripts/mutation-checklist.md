# Mutasyon kontrol listesi

Kritik her kural için geçici (kaydedilmeyen) kopyada bozucu değişiklik yap, test paketinin KIRMIZIYA dönmesini bekle.

| # | Mutasyon | Beklenen |
|---|---|---|
| 1 | Satır kilidini (FOR UPDATE / withLock) kaldır | eşzamanlılık testi kırılır |
| 2 | İdempotency kontrolünü kaldır | replay testi kırılır |
| 3 | `>` yerine `>=` (veya tersi) | sınır değer testi kırılır |
| 4 | Tavan (cap) hesabını atla | cap testi kırılır |
| 5 | İkinci kredi/iade korumasını kaldır | double-pay testi kırılır |
| 6 | `count !== 1` denetimini kaldır | stale-state testi kırılır |
| 7 | Geri almayı ileri işlemden büyük yap | reversal simetri testi kırılır |
| 8 | Yetki kontrolünü kaldır | yetki matrisi testi kırılır |
| 9 | Tutarı Number'a çevir (BigInt yerine) | büyük değer testi kırılır |
| 10 | Kapalı durumda olayı kabul et | closed-stays-closed testi kırılır |

Rapor: `mutations killed / total`. Hayatta kalan mutasyon = eksik test.
