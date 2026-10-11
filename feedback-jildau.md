# Feedback Jildau — verwerking

Bronnen: `feedback_1.docx` (20 punten) en `feedback_2.xlsx` (opmerkingen per functie).
Basis: serverexport van 11-10-2026 (146 functies, 721 paden).
Resultaat na verwerking: **135 functies, 689 paden**.

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

## Voor het overleg met Jildau en de groep

1. **Beleidsadviseur (zorg):** instroom komt nu alleen vanuit radiologisch laboranten en de medisch nucleair werker. Welke instroom klopt? En de beleidsadviseurs bij Facilitair: Jildau noemt dat er veel meer zijn, met andere aandachtsgebieden. Wie leveren we aan?
2. **"Logistiek medewerker" (OK, zonder schaal):** welke functie is dit? Anders verwijderen.
3. **Van OK-assistent naar logistiek coördinator op OK:** welke koppeling is bedoeld? Dit pad staat niet in de data.
4. **Gipsverbandmeester vanuit medisch hulpverlener:** zo'n pad bestaat niet in de data. Waar zag Jildau dit?
5. **Praktijkopleiders (acuut / kliniek):** als rol houden zonder vaste schaal, of weghalen?
6. **Basisfuncties → "Algemeen":** is dit een goede naam?
7. **"ca. 3-5 jaar":** klopt de uitleg "zo lang duurt het ongeveer voordat de stap reëel is"?
8. **FWG 15/25 in de zorg:** zijn er zorgfuncties op dat niveau die we moeten toevoegen?
9. **Teamleider Zorg B (kliniek/polikliniek) en teamleider Zorg B** zijn volgens Jildau dezelfde functie, net als teamleider Zorg A en teamleider Zorg A (acute as). Samenvoegen?
10. **Teamleider B (Receptie & Registratie en Vrijwilligerswerk):** Jildau schreef "teamleider Zorg B". Dat lijkt een vergissing; het is nu "teamleider B".
11. **Paden van logistiek medewerker E/D en afdelingslogistiek naar coördinator meewerkend schoonmaak:** stond "Is dit logisch?" bij. Houden?
12. **Kok in opleiding:** welke schaal ("schaal afhankelijk van …")?
13. **Algemene vereisten** zoals "Afgeronde vakopleiding" en "BIG-registratie" zijn vaag (punt 14: "wat voor opleiding?"). Wil de groep per functie de concrete opleiding aanleveren?
14. **12 functies zonder enkel pad**, die dus los in het overzicht staan: beheerder OK materialen, adviseur Vervoersmobiliteit, beleidsadviseur (Beveiliging/Veiligheid), beleidsadviseur Duurzaamheid, beleidsadviseur Zirop, BHV coördinator, hoofd (Inkoop & Logistiek), managementassistente, medewerker Patiëntenvervoer, projectleider, teamleider B (Schoonmaak), teamleider B (Patiëntenvervoer). Wat zijn hun instroom en vervolgstappen?
15. **Teamleiders Schoonmaak:** bij Beveiliging loopt de lijn nu van teamleider D naar teamleider B. Bij Schoonmaak heeft teamleider B (de strategische) nog geen enkel pad. Zal ik daar dezelfde lijn leggen (coördinator → teamleider D → teamleider B)?
