# Feedback Loopbaanlijnen Verkenner — verwerking

Bronnen: `feedback_1.docx` (20 punten) en `feedback_2.xlsx` (opmerkingen per functie).
Basis: serverexport van 11-10-2026 (146 functies, 721 paden).
Resultaat na ronde 1: **135 functies, 689 paden**. Na ronde 2 (26-10-2026): **134 functies, 699 paden**.

Besluiten (11-10-2026):
- We nemen over wat Jildau aangeeft, ook haar directe aanpassingen in de salariskolom.
- Functienamen volgen het functiehuis. Waar meerdere functies dezelfde naam krijgen, staat de afdeling of het niveau erachter, bijv. "Teamleider B (Schoonmaak)".
- De data volgt de schrijfwijze van het functiehuis ("medewerker Logistiek B1"). De app begint elke naam met een hoofdletter.
- Cluster "nvt" (was "Basisfuncties") heet nu "Algemeen".

Live gezet: oktober 2026 (nieuwe app-build en volledige data-import via phpMyAdmin).

Status: ✅ verwerkt · 💬 verwerkt, maar graag bevestigen in het overleg · ➖ niets aan gedaan (zie reden)

---

## Word-document (feedback_1.docx)

| # | Punt | Wat er is gedaan | Status |
|---|---|---|---|
| 1 | "Loopbaanpaden" en "loopbaanlijnen" door elkaar | De app gebruikt overal "loopbaanlijnen" (titel, welkomstscherm, zijpaneel). | ✅ |
| 1 | Specialisme deskundige bestaat niet; praktijkopleider acuut onbekend | Specialisme deskundige verwijderd. Praktijkopleiders: zie overleg. | ✅ / 💬 |
| 2 | Woord "hover" | Wordt: "Zoom in, of beweeg de muis over een functie om de naam te lezen". | ✅ |
| 3 | Beleidsadviseur: instroom alleen vanuit radiologisch laboranten | Niet aangepast: welke instroom klopt wel? | 💬 |
| 4 | "Klik voor meer details" in de popup, maar je kunt er niet op klikken | De popup verdwijnt bij het bewegen; klikken moet op het blokje zelf. Tekst wordt: "Klik op de functie voor meer details". | ✅ |
| 5 | Filtertitel "Care cluster" | Wordt "Cluster". | ✅ |
| 5 | Hoofd- en kleine letters in de clusterlijst | Alle clusters beginnen met een hoofdletter. | ✅ |
| 5 | Onduidelijk wat basisfuncties zijn | Hernoemd naar "Algemeen". | 💬 |
| 5 | Salarisschaal: "35" en "FWG 35" los, rare volgorde | Alle schalen staan als "FWG nn" en zijn op nummer gesorteerd. | ✅ |
| 5 | FWG 15 en FWG 25 ontbreken | In de zorgfamilie staat geen enkele functie op FWG 15 of 25; bij Facilitair wel. Toevoegen kan alleen met nieuwe functies. | 💬 |
| 6 | Organisatorisch hoofden: namen bestaan niet, ook hoofden in FWG 70 | Beide heten nu "Organisatorisch hoofd" (FWG 65 = B1, FWG 70 = A), met een nieuwe omschrijving: kliniek, polikliniek en eventueel functieafdeling. | ✅ |
| 7 | Legenda's: hoofd- en kleine letters door elkaar | Alle legenda's en lijsten beginnen met een hoofdletter. | ✅ |
| 8 | "Over welke grafiek hebben we het?" | "Grafiek" overal vervangen door "het overzicht (rechts)". | ✅ |
| 9 | Screenshot met rollen (kwaliteitsfunctionaris, neural practitioner, …) | Rollen die niet in het ETZ voorkomen zijn verwijderd (zie B1). | ✅ |
| 10 | Foutieve koppeling aan functiehuis: neonatologie | Verpleegkundige Bewaking A, FWG 55. | ✅ |
| 10 | … endoscopie | Laborant functieonderzoek B, omschrijving "Voert endoscopische onderzoeken uit." | ✅ |
| 10 | … coördinator meewerkend schoonmaak | Medewerker Huishouding A1 + add coördinator F. | ✅ |
| 10 | … medewerker huishoudelijke dienst = medewerker huishouding | Alle vier de functies aangepast (B1, B2, A1, A2). | ✅ |
| 10 | … van OK-assistent naar logistiek coördinator op OK | Zo'n pad staat niet in de data; niet duidelijk welke koppeling bedoeld is. | 💬 |
| 11 | 1e kok + add coördinator bestaat niet | Wordt "1e kok (Patiëntenvoeding)" en "1e kok (Restaurant)", beide kok A + add coördinator C. | ✅ |
| 12 | Wat zijn deze "3-5 jaar"? | Wordt "ca. 3-5 jaar", met uitleg in de popup en het welkomstscherm: indicatie van hoe lang het duurt voordat de stap reëel is. Voorwaarden zoals "mits HBO" staan er los van. | 💬 klopt deze uitleg? |
| 13 | Hoofd klinieken kan ook 70; hoofd = kliniek, polikliniek en functieafdeling | Zie punt 6. | ✅ |
| 14 | Engels ("Education required"); welke opleiding bij hoofd 65 → 70? | Alle vereisten in het Nederlands. Bij de organisatorisch hoofden is de vereiste weggehaald. | ✅ |
| 15 | Gipsverbandmeester niet vanuit medisch hulpverlener | In de data loopt geen pad tussen die twee. Instroom komt al alleen vanuit verpleegkundigen en de fysiotherapeut. | 💬 waar zag Jildau dit? |
| 16 | Woord patiënt niet goed weergegeven | Hersteld bij alle 4 de functies ("patiÃ«nten"). | ✅ |
| 17 | Neuroverpleegkundige: instroom ook vanuit hbo-verpleegkundige | Die instroom stond er al, maar bleef onzichtbaar omdat hbo-vpk ook een vervolgstap is. Met "Toon Instroom" staan zulke functies nu aan de instroomkant. | ✅ |
| 18 | Interventielaborant → verpleegkundig specialist niet reëel | Pad verwijderd. | ✅ |
| 19 | TMS is geen rol maar een functie/addendum | Wordt "Radiologisch laborant met specialisatie/TMS": laborant beeldvormende Technieken A + addendum TMS, FWG 55, Radiologie. | ✅ |
| 19 | Roldetails tonen "N/A" | Lege velden worden niet meer getoond. Bij een rol staat "geen vaste schaal (rol)". | ✅ |
| 20 | Teamleider C "basisniveau", B "middenniveau" klopt niet | Bij alle teamleiders staat nu: het niveau (A–D) hangt af van het aantal fte in het team. | ✅ |

## Excel (feedback_2.xlsx)

### B. Verwijderd of samengevoegd

| # | Functie | Opmerking Jildau | Wat er is gedaan | Status |
|---|---|---|---|---|
| B1 | Circulation, neural, renal, lecturer en nurse practitioner; kwaliteitsfunctionaris | Komt niet voor in het ETZ | Verwijderd, inclusief hun paden. | ✅ |
| B2 | Specialisme deskundige | Geen idee wat dit is | Verwijderd. | ✅ |
| B3 | Keukenassistent (FWG 15, fsp), medewerker koffievoorzieningen, assistentkok (FWG 25) | Bestaat niet | Verwijderd. | ✅ |
| B4 | Medewerker vergaderservice FWG 20 | Is restaurant A en staat er al | Verwijderd; de versie op FWG 25 blijft. | ✅ |
| B5 | Ventilation practitioner (twee varianten) | Wordt "ventilation practitioner", verpleegkundige Bewaking A, FWG 55 | Samengevoegd tot één functie. | ✅ |
| B6 | Praktijkopleider acuut / kliniek | Addendum 1e functionaris, geen vaste FWG | Blijven als rol; omschrijving: "addendum 1e functionaris, geen vaste FWG-schaal". | 💬 |
| B7 | Organisatorisch hoofden | Zie Word, punt 6 | | ✅ |
| B8 | 1e kok | Zie Word, punt 11 | | ✅ |
| B9 | Toezichthoudend medewerker stralingsbescherming | Zie Word, punt 19 | | ✅ |
| B10 | "Logistiek medewerker" (OK) en "Beleidsadviseur" (zorg) | Niet duidelijk welke functie / welke instroom | Niet aangepast. | 💬 |

### D. Teksten per functie

| # | Punt | Wat er is gedaan | Status |
|---|---|---|---|
| D1 | Functienamen (kolom C) | Overgenomen voor alle functies met een opmerking; bij dubbele namen staat de afdeling of het niveau erachter. Typfouten van Jildau verbeterd (stafmedwerker, logstiek, sendior). | ✅ |
| D2 | Functiehuisnamen (kolom F) | Overgenomen. "(de rest hoort er niet achter)" en "MBRT" weggehaald waar zij dat aangaf. Het veld heet in de app nu "Functiehuis" in plaats van "Niveau". | ✅ |
| D3 | Salarisschaal (kolom H) | Overal "FWG nn". | ✅ |
| D4 | Omschrijvingen (kolom J) | Teamleiders, organisatorisch hoofden, endoscopie, physician assistant, hbo-vpk BAZ en operatieassistent A aangepast. | ✅ |
| D5 | Vereisten | Zorgassistent: Helpende Zorg en Welzijn. Physician assistant: master + BIG + NAPA. | ✅ |
| D10 | Directe wijzigingen in de salariskolom | Coördinator Receptie & Registratie FWG 40 → 45; medewerker restaurant FWG 20 → 15. | ✅ |
| D11 | Hoofd hospitality | FWG 75 → 70, organisatorisch hoofd A2. | ✅ |
| — | Kok in opleiding: "schaal afhankelijk van" | Zin is niet af; salarisschaal blijft leeg. | 💬 |

## Aanvullende wijzigingen (na de feedback van Jildau)

| # | Bron | Punt | Wat er is gedaan | Status |
|---|---|---|---|---|
| E1 | Hoofd facilitair | Per 1 juli 2026 zijn er twee teamleiders bij Beveiliging: een operationele en een strategische | Nieuw: **teamleider D (Beveiliging en Bewaking)**, FWG 45 (opgezet naar de operationele teamleider bij Schoonmaak). De bestaande teamleider B (FWG 55) is de strategische; dat staat in de omschrijving. Naamgeving volgens Jildau (letter + afdeling). Lijn: medewerker → coördinator → teamleider D → teamleider B → hoofd. | ✅ |
| E2 | Eigen review styling | De waaier werd bij veel vervolgstappen (25–30) zo breed dat de tekst onleesbaar werd, en blokjes overlapten | Focusweergave vernieuwd: per cluster één kaart met de functies als labels, en één gebundelde lijn per cluster in plaats van één per functie. Instroom links, vervolgstappen rechts, de andere familie in een eigen paarse kaart. Rollen hebben een gestippelde rand. De tekst in de labels is donker op lichte kleuren en wit op donkere. De weergave zoomt nooit zo ver uit dat de tekst onleesbaar wordt, en houdt rekening met de legenda en de knoppen. | ✅ |
| E3 | Opdrachtgever | Overal dezelfde naam: "Loopbaanlijnen Verkenner" in plaats van "Ziekenhuis Loopbaanontwikkeling" | Titel van de startpagina en het browsertabblad aangepast; ook de voettekst ("ETZ Hospital Career Path Explorer") en de disclaimer ("loopbaanlijnen-tool"). | ✅ |
| E4 | Opdrachtgever | Nieuwe introtekst op de startpagina | "Ontdek jouw ontwikkelmogelijkheden binnen het ETZ. Bekijk welke functies en rollen er zijn en welke richtingen je op kunt. Of je nu wilt doorgroeien, je verdiepen in je vak of je verder wilt verbreden." | ✅ |

## Zelf gevonden en meegenomen

| Punt | Wat er is gedaan | Status |
|---|---|---|
| Testtekst bij 1e anesthesiemedewerker ("eerste punt", vereiste "test") | Weggehaald. | ✅ |
| 9 paden van een functie naar zichzelf (o.a. neuroverpleegkundige) | Verwijderd. | ✅ |
| Doorlooptijd "Is dit logisch?" bij 3 paden naar coördinator meewerkend schoonmaak | Tekst weggehaald, paden blijven staan. | 💬 zijn deze paden logisch? |
| Lege kopjes "Omschrijving"/"Vereisten" | Worden niet meer getoond als ze leeg zijn. | ✅ |
| Startknoppen in het welkomstscherm deden niets meer na de naamswijzigingen | Knoppen verwijzen nu naar het vaste ID van de functie in plaats van naar de naam; teksten bijgewerkt. Alle 9 getest (Zorg en Facilitair). | ✅ |
| "Care/non care" in het zijpaneel | Wordt "Soort functie: Zorg / Ondersteunend (niet-zorg)". | ✅ |

---

## Ronde 1: antwoorden op de open vragen (verwerkt in ronde 2)

| # | Vraag | Antwoord | Wat er is gedaan | Status |
|---|---|---|---|---|
| 1 | Beleidsadviseur (zorg): welke instroom? | Pak je zelf op | Wel al toegevoegd vanuit nieuwe feedback: verpleegkundige, hbo-verpleegkundige en teamleider Zorg A/B/C → beleidsadviseur (zie R2-3.g/h). | 💬 todo Eddie |
| 1 | Beleidsadviseurs Facilitair | Heten gewoon "beleidsadviseur", op verschillende schalen; 55 → 55, 55 → 60, 60 → hoofd | Hernoemd naar "beleidsadviseur (FWG 55)" / "(FWG 60)". Paden per afdeling: Veiligheid & Ontvangst 55 ↔ 55 (incl. BHV coördinator), 55 → 60 (beleidsadviseur, adviseur Vervoersmobiliteit), 60 → hoofd; Inkoop & Logistiek 60 (beleidsadviseur, contractmanager) → hoofd; beleidsadviseur Duurzaamheid (FWG 60, geen hoofd) krijgt instroom vanuit de 55's. | ✅ |
| 2 | "Logistiek medewerker" (OK) | FWG 35; materiaalbeheerder FWG 40 | Logistiek medewerker FWG 35, met een pad naar beheerder OK materialen (FWG 40). | ✅ |
| 3 | OK-assistent → logistiek coördinator OK | Pak je zelf op | — | 💬 todo Eddie |
| 4 | Gipsverbandmeester vanuit medisch hulpverlener | Toevoegen; ondersteunend, FWG 55 | Pad toegevoegd (gipsverbandmeester staat al in Medisch ondersteunend, FWG 55). | ✅ |
| 5 | Praktijkopleiders | Houden zonder vaste schaal | Ongewijzigd. | ✅ |
| 6 | Basisfuncties / "Algemeen" | Nieuw cluster "Management en beleid" voor leidinggevende functies; "Algemeen" wordt "Zorg" | "Algemeen" heet nu "Zorg". Nieuw cluster **Management en beleid** (eigen kleur): teamleider Zorg A/B/C, beide organisatorisch hoofden en de beleidsadviseur (zorg). | ✅ |
| 7 | "ca. 3-5 jaar" | Overal weghalen | Alle doorlooptijden in jaren verwijderd uit de data en de app; voorwaarden ("mits HBO") blijven staan. | ✅ |
| 8 | FWG 15/25 in de zorg | Niet nodig | — | ✅ |
| 9 | Teamleiders Zorg B/A dubbel | Samenvoegen | "Teamleider Zorg B (kliniek/polikliniek)" opgegaan in **teamleider Zorg B**, "teamleider Zorg A (acute as)" in **teamleider Zorg A**; alle paden overgenomen. | ✅ |
| 10 | Teamleider B (R&R en Vrijwilligerswerk) | Klopt | — | ✅ |
| 11 | Paden logistiek → coördinator meewerkend schoonmaak | Nagaan met Facilitair | — | 💬 todo Eddie |
| 12 | Kok in opleiding: schaal | Open laten | — | ✅ |
| 13 | Algemene vereisten | Klopt zoals het staat | — | ✅ |
| 14 | Functies zonder pad | Zie beleidsadviseurs (1) | Opgelost voor de beleidsadviseurs, BHV coördinator, adviseur Vervoersmobiliteit, hoofd Inkoop & Logistiek, beheerder OK materialen en teamleider B Schoonmaak. Nog zonder pad: managementassistente, medewerker Patiëntenvervoer, projectleider, teamleider B (Patiëntenvervoer). | 💬 todo Eddie |
| 15 | Teamleiders Schoonmaak | Ja, zelfde lijn | Pad teamleider D → teamleider B (Schoonmaak) toegevoegd; coördinator → teamleider D bestond al. | ✅ |

## Ronde 2: UX-aanpassingen

| # | Punt | Wat er is gedaan | Status |
|---|---|---|---|
| R2-2.a | Facilitair: werkenbij-links weg (komen later handmatig) | Alle links in de facilitaire familie verwijderd. Daar stond vaak "geen", wat als kapotte link werd getoond; de app toont nu alleen nog echte links (http…). Ook twee zorgfuncties met tekst in plaats van een link hersteld (anesthesiemedewerker A, operatie assistent A). | ✅ |
| R2-2.b | Eindpunt aangeven | Een functie zonder vervolgstap heeft een **dubbele donkere rand**, in het overzicht én in de clusterkaarten. Selecteer je een eindpunt, dan staat rechts een kaart "Eindpunt van deze loopbaanlijn" en in het zijpaneel een omkaderde melding. Ook in de popup en in de legenda/uitleg. | ✅ |
| R2-2.c | Aantal in de clusterkop is verwarrend | Weggehaald; de kop toont alleen de clusternaam. | ✅ |
| R2-2.d | Keuzelijst naast de titel (Overzicht / Doorstroom / Hiërarchisch / Relatief) is niet meer nodig | Weggehaald, inclusief de alternatieve weergaven en de dagre-bibliotheek. | ✅ |

## Ronde 2: nieuwe feedback

| # | Punt | Wat er is gedaan | Status |
|---|---|---|---|
| R2-3.a | Zorgassistent → dialyse-assistent vraagt diploma verzorgende IG | Voorwaarde "mits diploma verzorgende IG" bij dat pad. | ✅ |
| R2-3.b | PACU is acuut | PACU verpleegkundige naar cluster Acute zorg. | ✅ |
| R2-3.c | Echocardiografist en pacemaker technicus: post-hbo, niet vanuit mbo? | Niet aangepast; navragen bij Nadia. | 💬 todo Eddie |
| R2-3.d | Nieuw blokje verpleegkundige moeder en kind (4 losse EPA's) | Nieuwe functie **verpleegkundige moeder en kind**, verpleegkundige B, FWG 45, cluster Moeder en kind. Instroom vanuit verpleegkundige (mbo); door naar kinder-, obstetrie- en neonatologieverpleegkundige. | ✅ |
| R2-3.e | Verpleegkundige → polikliniek assistent is een stap terug (45 → 35) | Pad vervangen door verpleegkundige → **medisch assistent** (FWG 40). | 💬 bevestigen |
| R2-3.f | Teamleider staat bij "Algemeen" | Valt nu onder het nieuwe cluster Management en beleid. | ✅ |
| R2-3.g | (Beleids)adviseur vanuit verpleegkundige en hbo-verpleegkundige | Paden toegevoegd. | ✅ |
| R2-3.h | (Beleids)adviseur vanuit teamleider | Paden vanuit teamleider Zorg A, B en C toegevoegd. | ✅ |
| R2-3.i | Radiodiagnostisch laborant mist bij (hbo-)verpleegkundige | Paden naar radiologisch laborant all-round toegevoegd. | ✅ |
| R2-3.j | Medisch assistent → anesthesiemedewerker / operatieassistent (via duale opleiding) | Paden naar anesthesiemedewerker B en operatie assistent B, met voorwaarde "via de duale opleiding". | ✅ |
| R2-3.k | Hbo-verpleegkundige → verpleegkundige BAZ ontbrak | Pad hbo verpleegkundige → hbo verpleegkundige met BAZ toegevoegd. | ✅ |
| R2-3.l | BAZ niet aangemerkt als (extra) rol | BAZ blijft een functie met een extra rol. Dat stond alleen in het overzicht (bandje); nu ook "+ extra rol" in de clusterkaarten en in de popup. | ✅ |
| R2-3.m | Zoeken op "verpleegkundige (mbo)" vindt niets | Zoeken kijkt nu per woord naar naam, afdeling, functiehuis en de interne naam; "verpleegkundige (mbo)" vindt Verpleegkundige en Verpleegkundige met BAZ. | ✅ |
| R2-3.n | Zoeken op "verpleegkundige" toont Verpleegkundige niet | Resultaten op relevantie gesorteerd (exacte naam, dan "begint met", dan kortere namen eerst); maximaal 8 resultaten in plaats van 5. | ✅ |

## Ronde 2: zelf gevonden en meegenomen

| Punt | Wat er is gedaan | Status |
|---|---|---|
| Coördinerend radiologisch laborant en beheerder OK materialen hadden geen cluster (en vielen dus onder "Zorg") | Naar Medisch ondersteunend, net als hun collega's. Medewerker CSA heeft nog geen cluster. | ✅ / 💬 |
| Opende je de app met een link naar een functie terwijl het overzicht nog geen afmetingen had, dan belandden de clusterkaarten in het raster | De focusweergave wordt nu opnieuw opgebouwd zodra het overzicht klaar is. | ✅ |

---

## Todo Eddie

1. **Beleidsadviseur (zorg):** instroom en vervolgstappen bepalen; is nu nog een eindpunt.
2. **OK-assistent → logistiek coördinator op OK:** welke koppeling is bedoeld?
3. **Paden logistiek medewerker E/D en afdelingslogistiek → coördinator meewerkend schoonmaak:** nagaan met Facilitair of die kloppen.
4. **Echocardiografist en pacemaker technicus:** post-hbo? Navragen bij Nadia of de instroom vanuit mbo (o.a. verpleegkundige, medisch assistent) klopt.
5. **Functies zonder pad:** managementassistente, medewerker Patiëntenvervoer, projectleider, teamleider B (Patiëntenvervoer).
6. **Verpleegkundige → medisch assistent** (i.p.v. polikliniek assistent): bevestigen. Alternatief: polikliniekverpleegkundige (FWG 45).
7. **Medewerker CSA:** welk cluster?
