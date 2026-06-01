# Handleiding Database & Admin Paneel Setup

Dit project is gemigreerd naar een dynamische PHP + MySQL backend om functies en loopbaanpaden eenvoudig te beheren via een Admin paneel. Hieronder vind je de instructies voor zowel lokaal gebruik (met Docker) als online publicatie op een shared hosting provider.

---

## 1. Lokale Setup met Docker

Volg deze stappen om de applicatie lokaal te starten en de database te vullen:

### Stap A: Start de Docker Containers
Zorg dat Docker Desktop is opgestart op je machine. Voer in de root map van dit project het volgende commando uit:
```bash
docker-compose up -d --build
```
Dit start drie containers op:
- **Database (MySQL 8.0)** op poort `33060`
- **phpMyAdmin** op `http://localhost:8081` (Inloggen met `root` / `root_password` of `career_user` / `career_pass`)
- **PHP 8.2 API** op `http://localhost:8000`

### Stap B: Database Tabellen en Initiële Data Laden (Migratie)
Nadat de containers draaien, moet je de MySQL database tabellen aanmaken en vullen met de bestaande JSON-data. Voer hiervoor dit commando uit:
```bash
docker exec careerpath-api php migrate.php
```
*Alternatief:* Je kunt ook in je browser naar `http://localhost:8000/migrate.php` navigeren om de migratie te starten.

### Stap C: Start de Frontend
Nu de database actief is, kun je de Angular frontend starten zoals je gewend bent:
```bash
ng serve
```
Open `http://localhost:4200` in je browser. Onderaan de landingspagina vind je nu een link `⚙️ Beheerpaneel (Admin)` waarmee je functies en verbindingen kunt toevoegen, bewerken of verwijderen.

---

## 2. JSON Backups Synchroniseren

De lokale JSON bestanden (`career-nodes.json` etc.) fungeren nog steeds als een geldige backup. Als je via het Admin paneel aanpassingen maakt in de database, kun je deze wijzigingen terugschrijven naar de lokale JSON bestanden door het volgende commando uit te voeren op je host-machine:
```bash
npm run data:backup
```
Dit script haalt de laatste gegevens op uit de actieve MySQL database en overschrijft de JSON bestanden in `src/assets/data/`. Zo blijven je JSON bestanden altijd up-to-date als backup plan!

---

## 3. Online Setup op een Shared Hosting Provider

Wanneer je de website live zet op een shared hosting provider (die PHP 8+ en MySQL met phpMyAdmin aanbiedt), volg dan deze stappen:

### Stap A: Database Aanmaken en Importeren
1. Log in op het controlepaneel van je hosting provider (cPanel, DirectAdmin, Plesk, etc.).
2. Maak een nieuwe MySQL database aan (noteer de databasenaam, SQL-gebruiker en het wachtwoord).
3. Open **phpMyAdmin** via het controlepaneel.
4. Selecteer je database en importeer de SQL-tabellen en data. Je kunt de structuur exporteren vanuit je lokale phpMyAdmin (`http://localhost:8081`) of handmatig de volgende tabellen aanmaken:

```sql
CREATE TABLE nodes (
    id VARCHAR(100) PRIMARY KEY,
    family VARCHAR(20) NOT NULL,
    label VARCHAR(255) NOT NULL,
    department VARCHAR(255) DEFAULT '',
    level VARCHAR(255) DEFAULT '',
    salary VARCHAR(50) DEFAULT '',
    description TEXT,
    requirements TEXT,
    irregularity VARCHAR(100) DEFAULT '',
    roles VARCHAR(50) DEFAULT '',
    werkenbijlink TEXT,
    careNonCare VARCHAR(50) DEFAULT '',
    careCluster VARCHAR(100) DEFAULT '',
    pioLink TEXT,
    isRole TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    family VARCHAR(20) NOT NULL,
    from_node_id VARCHAR(100) NOT NULL,
    to_node_id VARCHAR(100) NOT NULL,
    timeframe VARCHAR(100) DEFAULT '',
    UNIQUE KEY unique_path (from_node_id, to_node_id, family),
    FOREIGN KEY (from_node_id) REFERENCES nodes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (to_node_id) REFERENCES nodes(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Stap B: Bouw de Productie Bundel
1. Voer het volgende commando uit in de root map op je lokale machine:
   ```bash
   npm run build
   ```
   Dit bouwt de Angular frontend én kopieert automatisch de complete `api/` map naar de output map `dist/hospital-career-development/browser/api/`.

### Stap C: Uploaden en Configureren op de Live Server
1. Upload de gehele inhoud van de map `dist/hospital-career-development/browser/` (inclusief de `api` submap) naar de public root (`public_html` of `httpdocs`) van je shared hosting server.
2. Pas op de live server in `api/db.php` de database inloggegevens aan:
   ```php
   $host = 'localhost'; // Vaak 'localhost' of het database host adres van je provider
   $dbname = 'naam_van_je_database';
   $username = 'je_database_gebruiker';
   $password = 'je_database_wachtwoord';
   ```
3. De frontend is ontworpen om automatisch te schakelen tussen de lokale Docker poort `8000` (tijdens lokaal ontwikkelen op poort `4200`) en het relatieve `/api` pad op de live server. Je hoeft dus **geen** links of TypeScript code handmatig aan te passen voor publicatie!

*(Tip: Verwijder `api/migrate.php` van je live server na de eerste installatie om veiligheidsredenen!)*
