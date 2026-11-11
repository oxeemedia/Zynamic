# Zynamik® Direct — sajt

Statični sajt (bez build koraka) za Zynamik® Direct, TheMinds / Delighted Minds d.o.o.

## Stranice

| Fajl | Stranica |
|---|---|
| `Main.dc.html` | Početna / prodajna stranica (grebalica, paketi 1 / 2+1 / 4+2) |
| `Checkout.dc.html` | Porudžbina + hvala stranica |
| `B2B.dc.html` | B2B za firme, upitnik |
| `NasaPrica.dc.html` | Naša priča |
| `PratiPosiljku.dc.html` | Praćenje pošiljke (link ka Pošti Srbije) |
| `Kontakt.dc.html` | Kontakt forma |
| `Header.dc.html`, `Footer.dc.html` | Zajedničke komponente, uvoze se u stranice |

`index.html` prebacuje na `Main.dc.html`. `support.js` i `vendor/` su runtime koji renderuje stranice; ne brisati.

## Tracking

`zd-track.js` beleži: pregled stranice, klik na „Poruči“, izbor paketa, prikaz i odbijanje grebalice, mejl iz grebalice, porudžbinu, kontakt i B2B upit. Izvor (UTM / fbclid / referrer) pamti se kao prvi dodir i ide uz svaku porudžbinu. Iznos porudžbine računa server, ne browser.

## Lokalno

```
python3 -m http.server 8000
```
pa otvori http://localhost:8000 (preko `file://` skripte ne rade).

## GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root.

## Pre puštanja uživo

- Popuniti sve `[ZAGRADE]`: cene 2+1 / 4+2 provera marže, broj kesica, dani garancije, telefon, radno vreme, citati, fotografije.
- Forme (checkout, B2B, kontakt, mejl iz grebalice) šalju podatke preko `zd-track.js` u Google Sheet (Apps Script). Upiši `ZD_ENDPOINT` u `zd-track.js`; dok je prazno, sajt je u demo modu i ništa ne šalje. Setup i dashboard: privatni repo `Zynamic-admin`.
- Kod `MINDS10` napraviti kao kupon (jednom po mejlu).
- Postaviti Meta pixel / GA4 za merenje konverzija.
