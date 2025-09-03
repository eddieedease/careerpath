import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import cytoscape from 'cytoscape';

interface NodeData {
  id: string;
  label: string;
  department: string;
  level: string;
  description: string;
  requirements: string[];
  salary: string;
}

interface CareerPath {
  from: string;
  to: string;
  timeframe?: string;
}

@Component({
  selector: 'app-explore',
  imports: [RouterLink, FormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
  standalone: true
})
export class Explore implements OnInit, AfterViewInit {
  @ViewChild('cytoscapeContainer', { static: true }) cytoscapeContainer!: ElementRef;
  
  cy: any;
  selectedNode: NodeData | null = null;

  // Add new properties
  searchQuery: string = '';
  searchResults: NodeData[] = [];
  selectedNodePaths: CareerPath[] = [];
  
  // Filter properties
  departments: string[] = [];
  selectedDepartment: string = '';
  salaryLevels: string[] = [];
  selectedSalaryLevel: string = '';
  
  // Welcome screen properties
  showWelcome: boolean = true;
  welcomeChoice: 'starter' | 'experienced' | 'specialized' | 'management' | '' = '';
  selectedStartNode: NodeData | null = null;
  
  constructor() {
    // Get unique departments and salary levels
    this.departments = [...new Set(this.careerData.map(node => node.department))].sort();
    this.salaryLevels = [...new Set(this.careerData.map(node => node.salary))].sort();
  }

  setWelcomeChoice(choice: 'starter' | 'experienced' | 'specialized' | 'management') {
    this.welcomeChoice = choice;
    this.selectedStartNode = null;
  }

  getRelevantDepartments(): string[] {
    switch (this.welcomeChoice) {
      case 'starter':
        return this.departments.filter(dept => 
          this.careerData.some(node => 
            node.department === dept && 
            ['Medewerker zorg C', 'Medewerker zorg A - helpende zorg en welzijn niv 2', 
             'medisch assistent D', 'medisch assistent C'].includes(node.level)
          )
        );
      case 'management':
        return this.departments.filter(dept => 
          this.careerData.some(node => 
            node.department === dept && 
            ['Teamleider zorg A', 'Teamleider zorg B', 'Organisatorisch hoofd A', 
             'Organisatorisch hoofd B1', 'generiek'].includes(node.level)
          )
        );
      case 'specialized':
        return this.departments.filter(dept => 
          this.careerData.some(node => 
            node.department === dept && 
            ['verpleegkundige specialist', 'Physician assistant', 'Sedatie praktijk specialist',
             'Deskundige infectiepreventie', 'verpleegkundige bewaking A'].includes(node.level)
          )
        );
      default:
        return this.departments;
    }
  }

  selectDepartment(department: string) {
    if (!department) {
      this.selectedStartNode = null;
      return;
    }

    this.selectedDepartment = department;
    const nodes = this.careerData.filter(node => node.department === department);
    
    switch (this.welcomeChoice) {
      case 'starter':
        this.selectedStartNode = nodes.find(node => 
          ['Medewerker zorg C', 'Medewerker zorg A - helpende zorg en welzijn niv 2', 
           'medisch assistent D', 'medisch assistent C'].includes(node.level)
        ) || nodes[0];
        break;
      case 'management':
        this.selectedStartNode = nodes.find(node => 
          ['Teamleider zorg C', 'Teamleider zorg B'].includes(node.level)
        ) || nodes[0];
        break;
      case 'specialized':
        this.selectedStartNode = nodes.find(node => 
          node.level.includes('verpleegkundige') || node.level.includes('specialist')
        ) || nodes[0];
        break;
      default:
        this.selectedStartNode = nodes[0];
    }
  }

  startExploring() {
    this.showWelcome = false;
    this.cy.nodes().style({ 'opacity': 0.15 });
    
    if (this.selectedStartNode) {
      const node = this.cy.getElementById(this.selectedStartNode.id);
      if (node) {
        this.selectNodeById(this.selectedStartNode.id);
        this.cy.center(node);
      }
    }
  }

  private careerData: NodeData[] = [
  {
    id: 'afdelingsassistent-fwg20',
    label: 'Afdelingsassistent',
    department: 'Zorg',
    level: 'Medewerker zorg C',
    description: 'Ondersteunt bij administratieve en organisatorische taken op de afdeling.',
    requirements: ['example'],
    salary: 'FWG 20'
  },
  {
    id: 'zorgassistent-fwg30',
    label: 'Zorgassistent',
    department: 'Zorg',
    level: 'Medewerker zorg A - helpende zorg en welzijn niv 2',
    description: 'Biedt basiszorg aan patiënten onder toezicht van gediplomeerde verpleegkundigen.',
    requirements: ['example'],
    salary: 'FWG 30'
  },
  {
    id: 'spreekuurassistent-fwg30',
    label: 'Spreekuurassistent',
    department: 'Medisch',
    level: 'medisch assistent D',
    description: 'Assisteert artsen tijdens spreekuren en ondersteunt patiënten.',
    requirements: ['example'],
    salary: 'FWG 30'
  },
  {
    id: 'polikliniek-assistent-fwg35',
    label: 'Polikliniek assistent',
    department: 'Medisch',
    level: 'medisch assistent C',
    description: 'Ondersteunt medische processen in de polikliniek.',
    requirements: ['example'],
    salary: 'FWG 35'
  },
  {
    id: 'medisch-assistent-fwg40',
    label: 'Medisch assistent',
    department: 'Medisch',
    level: 'medisch assistent B',
    description: 'Voert medisch-administratieve taken uit en ondersteunt artsen.',
    requirements: ['example'],
    salary: 'FWG 40'
  },
  {
    id: 'dialyse-assistent-fwg40',
    label: 'Dialyse assistent',
    department: 'Verpleging',
    level: 'Medewerker verpleging en verzorging',
    description: 'Assisteert bij dialysebehandelingen van patiënten.',
    requirements: ['example'],
    salary: 'FWG 40'
  },
  {
    id: 'mbo-verpleegkundige-fwg45',
    label: 'Mbo-Verpleegkundige',
    department: 'Verpleging',
    level: 'verpleegkundige B',
    description: 'Verleent directe patiëntenzorg op MBO-niveau.',
    requirements: ['example'],
    salary: 'FWG 45'
  },
  {
    id: 'mbo-verpleegkundige-baz-fwg45',
    label: 'Mbo-Verpleegkundige met BAZ',
    department: 'Verpleging',
    level: 'verpleegkundige B (BAZ)',
    description: 'MBO-verpleegkundige met Beperkt Aangepaste Zorg specialisatie.',
    requirements: ['example'],
    salary: 'FWG 45'
  },
  {
    id: 'polikliniek-verpleegkundige-fwg45',
    label: 'Polikliniek verpleegkundige',
    department: 'Verpleging',
    level: 'medisch assistent A',
    description: 'Verpleegkundige werkzaam in de polikliniek.',
    requirements: ['example'],
    salary: 'FWG 45'
  },
  {
    id: 'radiologisch-laborant-allround-fwg45',
    label: 'Radiologisch laborant all round',
    department: 'Radiologie',
    level: 'Laborant beeldvormende technieken B - MBRT aangevuld met aandachtsgebied',
    description: 'All-round radiologisch laborant voor verschillende beeldvormende technieken.',
    requirements: ['example'],
    salary: 'FWG 45'
  },
  {
    id: 'hbo-verpleegkundige-fwg50',
    label: 'Hbo-Verpleegkundige',
    department: 'Verpleging',
    level: 'Verpleegkundige A',
    description: 'Verleent directe patiëntenzorg op HBO-niveau.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'hbo-verpleegkundige-baz-fwg50',
    label: 'Hbo-Verpleegkundige met BAZ',
    department: 'Verpleging',
    level: 'Verpleegkundige A (BAZ)',
    description: 'HBO-verpleegkundige met Beperkt Aangepaste Zorg specialisatie.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'oncologie-verpleegkundige-fwg50',
    label: 'Oncologie verpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige in de oncologie.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'kinderverpleegkundige-fwg50',
    label: 'Kinderverpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige voor pediatrische zorg.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'verpleegkundige-obstetrie-fwg50',
    label: 'Verpleegkundige obstetrie',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige in de verloskunde.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'neuro-verpleegkundige-fwg50',
    label: 'Neuro verpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige in de neurologie.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'geriatrie-verpleegkundige-fwg50',
    label: 'Geriatrie verpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige in de geriatrie.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'psychiatrisch-verpleegkundige-fwg50',
    label: 'Psychiatrisch verpleegkundige',
    department: 'Verpleging',
    level: 'Psychiatrisch verpleegkundige',
    description: 'Gespecialiseerde verpleegkundige in de psychiatrie.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'neonatologie-verpleegkundige-fwg50',
    label: 'Neonatologie verpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige in de neonatologie.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'dialyse-verpleegkundige-fwg50',
    label: 'Dialyse verpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige voor dialysebehandelingen.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'endoscopie-verpleegkundige-fwg50',
    label: 'Endoscopie verpleegkundige',
    department: 'Verpleging',
    level: 'Specialistisch verpleegkundige B',
    description: 'Gespecialiseerde verpleegkundige voor endoscopische procedures.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'avond-nacht-coordinator-fwg50',
    label: 'Avond/nacht coördinator',
    department: 'Verpleging',
    level: 'avond/nachtcoördinator',
    description: 'Coördineert zorgverlening tijdens avond- en nachtdiensten.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'pacu-verpleegkundige-fwg50',
    label: 'PACU verpleegkundige',
    department: 'Verpleging',
    level: 'verpleegkundige bewaking B2',
    description: 'Verpleegkundige werkzaam op de Post Anesthesia Care Unit.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'operatieassistent-fwg50',
    label: 'Operatieassistent',
    department: 'Operatie',
    level: 'Operatieassistent B',
    description: 'Assisteert bij operatieve ingrepen.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'anesthesiemedewerker-fwg50',
    label: 'Anesthesiemedewerker',
    department: 'Anesthesie',
    level: 'Anesthesiemedewerker B',
    description: 'Ondersteunt bij anesthesieprocedures.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'radiologisch-laborant-specialisatie-fwg50',
    label: 'Radiologisch laborant met specialisatie',
    department: 'Radiologie',
    level: 'Laborant beeldvormende technieken A - MBRT',
    description: 'Gespecialiseerde radiologisch laborant.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'teamleider-c-fwg50',
    label: 'Teamleider C',
    department: 'Management',
    level: 'generiek',
    description: 'Teamleider op basis niveau.',
    requirements: ['example'],
    salary: 'FWG 50'
  },
  {
    id: 'ic-verpleegkundige-fwg55',
    label: 'IC verpleegkundige',
    department: 'Verpleging',
    level: 'Verpleegkundige bewaking A',
    description: 'Gespecialiseerde verpleegkundige op de Intensive Care.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'seh-verpleegkundige-fwg55',
    label: 'SEH verpleegkundige',
    department: 'Verpleging',
    level: 'verpleegkundige spoedeisende zorg A',
    description: 'Gespecialiseerde verpleegkundige op de Spoedeisende Hulp.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'ccu-verpleegkundige-fwg55',
    label: 'CCU verpleegkundige',
    department: 'Verpleging',
    level: 'verpleegkundige bewaking A',
    description: 'Gespecialiseerde verpleegkundige op de Coronary Care Unit.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'seh-verpleegkundige-ambulance-fwg55',
    label: 'SEH verpleegkundige + Ambulance',
    department: 'Verpleging',
    level: 'verpleegkundige spoedeisende zorg A = ambulance',
    description: 'SEH verpleegkundige met ambulance-ervaring.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'ventilation-renal-neural-practitioner-fwg55',
    label: 'Ventilation, Renal of Neural practitioner',
    department: 'Verpleging',
    level: 'Verpleegkundige bewaking A',
    description: 'Gespecialiseerde practitioner voor beademing, nier- of neurologische zorg.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'medisch-hulpverlener-fwg55',
    label: 'Medisch hulpverlener',
    department: 'Medisch',
    level: 'Medisch hulpverlener',
    description: 'Verleent medische hulp en ondersteuning.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'fysiotherapeut-fwg55',
    label: 'Fysiotherapeut',
    department: 'Paramedisch',
    level: 'Fysiotherapeut',
    description: 'Verleent fysiotherapeutische behandelingen.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'teamleider-kliniek-fwg55',
    label: 'Teamleider kliniek',
    department: 'Management',
    level: 'Teamleider zorg B',
    description: 'Leidt team in klinische omgeving.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'gipsverbandmeester-fwg55',
    label: 'Gipsverbandmeester',
    department: 'Paramedisch',
    level: 'vakman vormende techniek A',
    description: 'Gespecialiseerd in het aanleggen van gipsverbanden.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'interventielaborant-fwg55',
    label: 'Interventielaborant',
    department: 'Radiologie',
    level: 'Laborant functieonderzoek A1',
    description: 'Gespecialiseerde laborant voor interventionele procedures.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'radiologisch-laborant-echo-gyn-fwg55',
    label: 'Radiologisch laborant met specialisatie (echo gyn)',
    department: 'Radiologie',
    level: 'Laborant functieonderzoek A2',
    description: 'Gespecialiseerde laborant voor gynecologische echografie.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'operatieassistent-fwg55',
    label: 'Operatieassistent',
    department: 'Operatie',
    level: 'Operatieassistent A',
    description: 'Senior operatieassistent.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'anesthesiemedewerker-fwg55',
    label: 'Anesthesiemedewerker',
    department: 'Anesthesie',
    level: 'Anesthesiemedewerker A',
    description: 'Senior anesthesiemedewerker.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'interventielaborant-specialisatie-fwg55',
    label: 'Interventielaborant met specialisatie',
    department: 'Radiologie',
    level: 'Laborant functieonderzoek A1',
    description: 'Gespecialiseerde interventielaborant.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'teamleider-b-fwg55',
    label: 'Teamleider B',
    department: 'Management',
    level: 'generiek',
    description: 'Teamleider op middenniveau.',
    requirements: ['example'],
    salary: 'FWG 55'
  },
  {
    id: 'physician-assistant-fwg60',
    label: 'Physician assistant',
    department: 'Medisch',
    level: 'Physician assistant',
    description: 'Assisteert artsen bij diagnose en behandeling van patiënten.',
    requirements: ['example'],
    salary: 'FWG 60'
  },
  {
    id: 'verpleegkundig-specialist-fwg60',
    label: 'Verpleegkundig specialist',
    department: 'Verpleging',
    level: 'verpleegkundige specialist',
    description: 'Hooggespecialiseerde verpleegkundige met uitgebreide bevoegdheden.',
    requirements: ['example'],
    salary: 'FWG 60'
  },
  {
    id: 'teamleider-acute-as-fwg60',
    label: 'Teamleider acute as',
    department: 'Management',
    level: 'Teamleider zorg A',
    description: 'Leidt team in acute zorgomgeving.',
    requirements: ['example'],
    salary: 'FWG 60'
  },
  {
    id: 'deskundige-infectiepreventie-fwg60',
    label: 'Deskundige infectiepreventie',
    department: 'Infectiepreventie',
    level: 'Deskundige infectiepreventie',
    description: 'Expert in infectiepreventie en -controle.',
    requirements: ['example'],
    salary: 'FWG 60'
  },
  {
    id: 'sedatiepraktijk-specialist-fwg60',
    label: 'Sedatiepraktijk-specialist',
    department: 'Anesthesie',
    level: 'Sedatie praktijk specialist',
    description: 'Gespecialiseerd in sedatieprocedures.',
    requirements: ['example'],
    salary: 'FWG 60'
  },
  {
    id: 'teamleider-a-fwg60',
    label: 'Teamleider A',
    department: 'Management',
    level: 'generiek',
    description: 'Senior teamleider.',
    requirements: ['example'],
    salary: 'FWG 60'
  },
  {
    id: 'organisatorisch-hoofd-klinieken-fwg65',
    label: 'Organisatorisch hoofd klinieken',
    department: 'Management',
    level: 'Organisatorisch hoofd B1',
    description: 'Hoofd van klinische afdelingen.',
    requirements: ['example'],
    salary: 'FWG 65'
  },
  {
    id: 'organisatorisch-hoofd-acute-as-fwg70',
    label: 'Organisatorisch hoofd acute as',
    department: 'Management',
    level: 'Organisatorisch hoofd A',
    description: 'Hoofd van acute zorgafdelingen.',
    requirements: ['example'],
    salary: 'FWG 70'
  }
];

  // Career paths based on the flowchart connections:
private careerPaths: CareerPath[] = [
  // Entry level to basic nursing
  { from: 'afdelingsassistent-fwg20', to: 'zorgassistent-fwg30', timeframe: '1-2 jaar' },
  { from: 'zorgassistent-fwg30', to: 'dialyse-assistent-fwg40', timeframe: '2-3 jaar' },
  { from: 'dialyse-assistent-fwg40', to: 'mbo-verpleegkundige-fwg45', timeframe: '1-2 jaar' },
  
  // Medical assistant pathway
  { from: 'spreekuurassistent-fwg30', to: 'polikliniek-assistent-fwg35', timeframe: '1-2 jaar' },
  { from: 'polikliniek-assistent-fwg35', to: 'medisch-assistent-fwg40', timeframe: '1-2 jaar' },
  { from: 'medisch-assistent-fwg40', to: 'polikliniek-verpleegkundige-fwg45', timeframe: '2-3 jaar' },
  
  // MBO to HBO nursing progression
  { from: 'mbo-verpleegkundige-fwg45', to: 'hbo-verpleegkundige-fwg50', timeframe: '2-4 jaar' },
  { from: 'mbo-verpleegkundige-baz-fwg45', to: 'hbo-verpleegkundige-baz-fwg50', timeframe: '2-4 jaar' },
  
  // Specialization pathways from HBO nurse
  { from: 'hbo-verpleegkundige-fwg50', to: 'oncologie-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'kinderverpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'verpleegkundige-obstetrie-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'neuro-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'geriatrie-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'psychiatrisch-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'neonatologie-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'dialyse-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'endoscopie-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'avond-nacht-coordinator-fwg50', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'pacu-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  
  // Advanced nursing specializations
  { from: 'hbo-verpleegkundige-fwg50', to: 'ic-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'seh-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'ccu-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'seh-verpleegkundige-fwg55', to: 'seh-verpleegkundige-ambulance-fwg55', timeframe: '1-2 jaar' },
  { from: 'ic-verpleegkundige-fwg55', to: 'ventilation-renal-neural-practitioner-fwg55', timeframe: '1-2 jaar' },
  
  // Technical/procedural pathways
  { from: 'radiologisch-laborant-allround-fwg45', to: 'radiologisch-laborant-specialisatie-fwg50', timeframe: '2-3 jaar' },
  { from: 'radiologisch-laborant-specialisatie-fwg50', to: 'radiologisch-laborant-echo-gyn-fwg55', timeframe: '1-2 jaar' },
  { from: 'operatieassistent-fwg50', to: 'operatieassistent-fwg55', timeframe: '2-3 jaar' },
  { from: 'anesthesiemedewerker-fwg50', to: 'anesthesiemedewerker-fwg55', timeframe: '2-3 jaar' },
  { from: 'interventielaborant-fwg55', to: 'interventielaborant-specialisatie-fwg55', timeframe: '1-2 jaar' },
  
  // Management progression
  { from: 'teamleider-c-fwg50', to: 'teamleider-b-fwg55', timeframe: '2-3 jaar' },
  { from: 'teamleider-b-fwg55', to: 'teamleider-kliniek-fwg55', timeframe: '1-2 jaar' },
  { from: 'teamleider-b-fwg55', to: 'teamleider-a-fwg60', timeframe: '2-3 jaar' },
  { from: 'teamleider-kliniek-fwg55', to: 'teamleider-acute-as-fwg60', timeframe: '2-3 jaar' },
  { from: 'teamleider-acute-as-fwg60', to: 'organisatorisch-hoofd-klinieken-fwg65', timeframe: '3-5 jaar' },
  { from: 'organisatorisch-hoofd-klinieken-fwg65', to: 'organisatorisch-hoofd-acute-as-fwg70', timeframe: '3-5 jaar' },
  
  // Advanced professional roles
  { from: 'hbo-verpleegkundige-fwg50', to: 'physician-assistant-fwg60', timeframe: '3-4 jaar' },
  { from: 'ic-verpleegkundige-fwg55', to: 'verpleegkundig-specialist-fwg60', timeframe: '3-4 jaar' },
  { from: 'seh-verpleegkundige-fwg55', to: 'verpleegkundig-specialist-fwg60', timeframe: '3-4 jaar' },
  { from: 'ccu-verpleegkundige-fwg55', to: 'verpleegkundig-specialist-fwg60', timeframe: '3-4 jaar' },
  
  // Specialized expert roles
  { from: 'anesthesiemedewerker-fwg55', to: 'sedatiepraktijk-specialist-fwg60', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-fwg50', to: 'deskundige-infectiepreventie-fwg60', timeframe: '3-4 jaar' },
  
  // Cross-departmental moves
  { from: 'medisch-assistent-fwg40', to: 'mbo-verpleegkundige-fwg45', timeframe: '2-3 jaar' },
  { from: 'polikliniek-verpleegkundige-fwg45', to: 'hbo-verpleegkundige-fwg50', timeframe: '2-3 jaar' },
  { from: 'dialyse-assistent-fwg40', to: 'dialyse-verpleegkundige-fwg50', timeframe: '2-3 jaar' },
  
  // Alternative specialist pathways
  { from: 'hbo-verpleegkundige-fwg50', to: 'medisch-hulpverlener-fwg55', timeframe: '2-3 jaar' },
  { from: 'medisch-hulpverlener-fwg55', to: 'physician-assistant-fwg60', timeframe: '2-3 jaar' },
  
  // Leadership from clinical roles
  { from: 'oncologie-verpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'kinderverpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'neuro-verpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'ic-verpleegkundige-fwg55', to: 'teamleider-kliniek-fwg55', timeframe: '3-4 jaar' },
  { from: 'seh-verpleegkundige-fwg55', to: 'teamleider-acute-as-fwg60', timeframe: '3-4 jaar' },
  
  // Additional technical progressions
  { from: 'gipsverbandmeester-fwg55', to: 'fysiotherapeut-fwg55', timeframe: '2-3 jaar' },
  
  // Senior specialist to management
  { from: 'physician-assistant-fwg60', to: 'teamleider-a-fwg60', timeframe: '2-3 jaar' },
  { from: 'verpleegkundig-specialist-fwg60', to: 'organisatorisch-hoofd-klinieken-fwg65', timeframe: '4-5 jaar' },
  
  // Internal progression within same level but different specializations
  { from: 'oncologie-verpleegkundige-fwg50', to: 'kinderverpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'kinderverpleegkundige-fwg50', to: 'neonatologie-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  { from: 'verpleegkundige-obstetrie-fwg50', to: 'neonatologie-verpleegkundige-fwg50', timeframe: '1-2 jaar' },
  
  // HBO verpleegkundige met BAZ career advancement paths (missing from original)
  { from: 'hbo-verpleegkundige-baz-fwg50', to: 'ic-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-baz-fwg50', to: 'seh-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-baz-fwg50', to: 'ccu-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'hbo-verpleegkundige-baz-fwg50', to: 'physician-assistant-fwg60', timeframe: '3-4 jaar' },
  { from: 'hbo-verpleegkundige-baz-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  
  // Additional missing paths from other roles
  { from: 'polikliniek-verpleegkundige-fwg45', to: 'operatieassistent-fwg50', timeframe: '2-3 jaar' },
  { from: 'polikliniek-verpleegkundige-fwg45', to: 'anesthesiemedewerker-fwg50', timeframe: '2-3 jaar' },
  { from: 'mbo-verpleegkundige-fwg45', to: 'operatieassistent-fwg50', timeframe: '2-3 jaar' },
  { from: 'mbo-verpleegkundige-fwg45', to: 'anesthesiemedewerker-fwg50', timeframe: '2-3 jaar' },
  { from: 'mbo-verpleegkundige-baz-fwg45', to: 'operatieassistent-fwg50', timeframe: '2-3 jaar' },
  { from: 'mbo-verpleegkundige-baz-fwg45', to: 'anesthesiemedewerker-fwg50', timeframe: '2-3 jaar' },
  
  // Radiological career advancement from base level
  { from: 'radiologisch-laborant-allround-fwg45', to: 'interventielaborant-fwg55', timeframe: '3-4 jaar' },
  
  // Additional specialist to leadership paths
  { from: 'verpleegkundige-obstetrie-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'geriatrie-verpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'psychiatrisch-verpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'dialyse-verpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  { from: 'endoscopie-verpleegkundige-fwg50', to: 'teamleider-c-fwg50', timeframe: '2-3 jaar' },
  
  // Technical specialist cross-training
  { from: 'operatieassistent-fwg55', to: 'anesthesiemedewerker-fwg55', timeframe: '1-2 jaar' },
  { from: 'anesthesiemedewerker-fwg55', to: 'operatieassistent-fwg55', timeframe: '1-2 jaar' },
  
  // Advanced coordinator roles
  { from: 'avond-nacht-coordinator-fwg50', to: 'teamleider-kliniek-fwg55', timeframe: '2-3 jaar' },
  { from: 'pacu-verpleegkundige-fwg50', to: 'ic-verpleegkundige-fwg55', timeframe: '2-3 jaar' },
  { from: 'pacu-verpleegkundige-fwg50', to: 'anesthesiemedewerker-fwg55', timeframe: '2-3 jaar' },
];

  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeCytoscape();
  }

  private initializeCytoscape() {
    const elements = [
      ...this.careerData.map(node => ({
        data: { 
          id: node.id, 
          label: node.label,
          department: node.department,
          level: node.level
        }
      })),
      ...this.careerPaths.map(path => ({
        data: { 
          source: path.from, 
          target: path.to,
          timeframe: path.timeframe 
        }
      }))
    ];

    this.cy = cytoscape({
      container: this.cytoscapeContainer.nativeElement,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e40af', // Default blue
            'label': 'data(label)',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'font-weight': 'bold',
            'width': '130px',
            'height': '70px',
            'shape': 'round-rectangle',
            'border-width': '2px',
            'border-color': '#ffffff',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'text-outline-color': '#000000',
            'text-outline-width': '1px',
            'opacity': 1
          }
        },
        // Entry level positions (green)
        {
          selector: 'node[level="Medewerker zorg C"], node[level="Medewerker zorg A - helpende zorg en welzijn niv 2"], node[level="medisch assistent D"], node[level="medisch assistent C"]',
          style: { 
            'background-color': '#16a34a',
            'opacity': 1
          }
        },
        // Standard healthcare roles (blue)
        {
          selector: 'node[level="verpleegkundige B"], node[level="Verpleegkundige A"], node[level="medisch assistent B"], node[level="medisch assistent A"], node[level="Specialistisch verpleegkundige B"]',
          style: { 
            'background-color': '#2563eb',
            'opacity': 1
          }
        },
        // Management roles (red)
        {
          selector: 'node[level="Teamleider zorg A"], node[level="Teamleider zorg B"], node[level="Organisatorisch hoofd A"], node[level="Organisatorisch hoofd B1"], node[level="generiek"]',
          style: { 
            'background-color': '#dc2626',
            'opacity': 1
          }
        },
        // High specialized roles (purple)
        {
          selector: 'node[level="verpleegkundige specialist"], node[level="Physician assistant"], node[level="Sedatie praktijk specialist"], node[level="Deskundige infectiepreventie"], node[level="verpleegkundige bewaking A"], node[level="verpleegkundige spoedeisende zorg A"], node[level="verpleegkundige spoedeisende zorg A = ambulance"]',
          style: { 
            'background-color': '#7e22ce',
            'opacity': 1
          }
        },
        // Support/technical roles (orange) 
        {
          selector: 'node[level="vakman vormende techniek A"], node[level="Fysiotherapeut"], node[level="Laborant functieonderzoek A1"], node[level="Laborant functieonderzoek A2"], node[level="Laborant beeldvormende technieken A"], node[level="Laborant beeldvormende technieken B"], node[level="Operatieassistent A"], node[level="Operatieassistent B"], node[level="Anesthesiemedewerker A"], node[level="Anesthesiemedewerker B"]',
          style: { 
            'background-color': '#f97316',
            'opacity': 1
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fbbf24',
            'border-width': '4px',
            'opacity': 1
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.8,
        avoidOverlap: true,
        // Add more default layout options
        padding: 50,
        animate: true,
        animationDuration: 500,
      },
      // Disable built-in zoom
      userZoomingEnabled: false,
      minZoom: 0.1,
      maxZoom: 3,
      zoom: 1
    });

    // Custom zoom handler
    let currentZoom = 1;
    const zoomStep = 0.1;

    this.cytoscapeContainer.nativeElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      
      // Calculate new zoom level
      if (event.deltaY < 0) {
        currentZoom = Math.min(currentZoom + zoomStep, 3);
      } else {
        currentZoom = Math.max(currentZoom - zoomStep, 0.1);
      }

      // Apply zoom centered on mouse position
      const mousePosition = this.cy.renderer().projectIntoViewport(event.offsetX, event.offsetY);
      this.cy.zoom({
        level: currentZoom,
        renderedPosition: { x: event.offsetX, y: event.offsetY }
      });
    });

    this.cy.on('tap', 'node', (event: any) => {
      const nodeId = event.target.id();
      const node = event.target;
      
      this.selectedNode = this.careerData.find(node => node.id === nodeId) || null;
      this.updateSelectedNodePaths(nodeId);
      
      // First reset all edges to default style
      this.cy.edges().style({
        'opacity': 0.2,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 1
      });

      // Set all nodes to dim state but keep them visible
      this.cy.nodes().style({
        'opacity': 0.15
      });

      // Get connected elements
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();
      
      // Highlight connected nodes
      connectedNodes.style({
        'opacity': 1
      });
      
      // Color incoming edges red
      const incomingEdges = node.incomers('edge');
      incomingEdges.style({
        'line-color': '#dc2626',
        'target-arrow-color': '#dc2626',
        'width': 3,
        'opacity': 1
      });
      
      // Color outgoing edges green
      const outgoingEdges = node.outgoers('edge');
      outgoingEdges.style({
        'line-color': '#16a34a',
        'target-arrow-color': '#16a34a',
        'width': 3,
        'opacity': 1
      });

      // Make selected node stand out
      node.style({
        'opacity': 1,
        'border-color': '#fbbf24',
        'border-width': '4px'
      });
    });
  }

  selectSearchResult(node: NodeData) {
    this.searchQuery = '';
    this.searchResults = [];
    const cyNode = this.cy.getElementById(node.id);
    if (cyNode) {
      cyNode.trigger('tap');
      
      this.cy.fit(cyNode.neighborhood().add(cyNode), 100);
    }
  }

  public resetView(): void {
    if (this.cy) {
      // Reset all elements to default style
      this.cy.elements().style({
        'opacity': 1,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'width': 3,
        'arrow-scale': 1,
        'border-width': '2px',
        'border-color': '#ffffff'
      });
      
      this.cy.fit();
    }
  }

  // Add new methods
  onSearch(event: any) {
    const query = this.searchQuery.toLowerCase();
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    this.showWelcome = false; // Hide welcome screen when searching
    this.searchResults = this.careerData.filter(node =>
      node.label.toLowerCase().includes(query) ||
      node.department.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results
  }

  getNodeLabel(nodeId: string): string {
    return this.careerData.find(node => node.id === nodeId)?.label || nodeId;
  }

  updateSelectedNodePaths(nodeId: string) {
    // Find all possible career paths from this node
    this.selectedNodePaths = this.careerPaths.filter(path => path.from === nodeId);
  }

  selectNodeById(nodeId: string) {
    const node = this.cy.getElementById(nodeId);
    if (node) {
      this.showWelcome = false; // Hide welcome screen when a node is selected
      // Trigger the tap event to update selection
      node.trigger('tap');
      
      // Center and zoom to the node
      this.cy.fit(node.neighborhood().add(node), 100);
      
      // Ensure the node is clearly visible
      this.cy.center(node);
    }
  }

  // Filter nodes based on selected department and salary
  applyFilters() {
    // Reset all nodes to visible first
    this.cy.nodes().style({ 'display': 'element' });
    
    // Apply department filter
    if (this.selectedDepartment) {
      this.showWelcome = false; // Hide welcome screen when a department is selected
      this.cy.nodes().filter((node: any) => 
        node.data('department') !== this.selectedDepartment
      ).style({ 'display': 'none' });
    }
    
    // Apply salary filter
    if (this.selectedSalaryLevel) {
      this.showWelcome = false; // Hide welcome screen when a salary level is selected
      this.cy.nodes().filter((node: any) => 
        node.data('salary') !== this.selectedSalaryLevel
      ).style({ 'display': 'none' });
    }
    
    // Fit the view to show visible nodes
    this.cy.fit();
  }

  // Reset all filters
  resetFilters() {
    this.selectedDepartment = '';
    this.selectedSalaryLevel = '';
    this.cy.nodes().style({ 'display': 'element' });
    this.cy.fit();
  }

  // Add new method to handle layout changes
  changeLayout(event: Event) {
    const select = event.target as HTMLSelectElement;
    const layoutName = select.value;
    
    const layoutOptions: any = {
      breadthfirst: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.8,
        avoidOverlap: true,
      },
      circle: {
        name: 'circle',
        spacingFactor: 1.5,
        avoidOverlap: true,
      },
      concentric: {
        name: 'concentric',
        minNodeSpacing: 50,
        avoidOverlap: true,
      },
      grid: {
        name: 'grid',
        avoidOverlap: true,
        spacingFactor: 1.5,
      },
      random: {
        name: 'random',
        avoidOverlap: true,
      }
    };

    // Common options for all layouts
    const commonOptions = {
      animate: true,
      animationDuration: 500,
      padding: 50,
      fit: true
    };

    const layout = this.cy.layout({
      ...layoutOptions[layoutName],
      ...commonOptions
    });

    layout.run();
  }
}