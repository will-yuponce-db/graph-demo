import type { GraphNode, GraphEdge, GraphData } from '../types/graph';
import { ChangeStatus, NodeType, RelationshipType } from '../types/graph';

// Mock data representing denormalized graph data from Databricks SQL
// Simulates an existing knowledge graph with proposed additions

const mockNodes: GraphNode[] = [
  // Existing nodes - Companies
  {
    id: 'company_1',
    label: 'TechCorp Inc',
    type: NodeType.COMPANY,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'TechCorp Inc',
      industry: 'Technology',
      founded: 2010,
      employees: 5000,
      revenue: '500M',
    },
  },
  {
    id: 'company_2',
    label: 'DataSystems LLC',
    type: NodeType.COMPANY,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'DataSystems LLC',
      industry: 'Software',
      founded: 2015,
      employees: 1200,
      revenue: '120M',
    },
  },
  {
    id: 'company_3',
    label: 'CloudVentures',
    type: NodeType.COMPANY,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'CloudVentures',
      industry: 'Cloud Computing',
      founded: 2018,
      employees: 800,
      revenue: '80M',
    },
  },

  // Existing nodes - People
  {
    id: 'person_1',
    label: 'Sarah Johnson',
    type: NodeType.PERSON,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'Sarah Johnson',
      title: 'CEO',
      email: 'sarah.j@techcorp.com',
      years_experience: 15,
    },
  },
  {
    id: 'person_2',
    label: 'Michael Chen',
    type: NodeType.PERSON,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'Michael Chen',
      title: 'CTO',
      email: 'mchen@techcorp.com',
      years_experience: 12,
    },
  },
  {
    id: 'person_3',
    label: 'Emily Rodriguez',
    type: NodeType.PERSON,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'Emily Rodriguez',
      title: 'VP Engineering',
      email: 'erodriguez@datasystems.com',
      years_experience: 10,
    },
  },
  {
    id: 'person_4',
    label: 'James Wilson',
    type: NodeType.PERSON,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'James Wilson',
      title: 'Head of Product',
      email: 'jwilson@techcorp.com',
      years_experience: 8,
    },
  },
  {
    id: 'person_5',
    label: 'Aisha Patel',
    type: NodeType.PERSON,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'Aisha Patel',
      title: 'Lead Data Scientist',
      email: 'apatel@datasystems.com',
      years_experience: 7,
    },
  },

  // Existing nodes - Products
  {
    id: 'product_1',
    label: 'DataHub Pro',
    type: NodeType.PRODUCT,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'DataHub Pro',
      category: 'Data Platform',
      version: '3.2.1',
      launch_date: '2020-06-15',
      price: 1999,
    },
  },
  {
    id: 'product_2',
    label: 'AnalyticsSuite',
    type: NodeType.PRODUCT,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'AnalyticsSuite',
      category: 'Business Intelligence',
      version: '2.8.0',
      launch_date: '2019-03-20',
      price: 799,
    },
  },
  {
    id: 'product_3',
    label: 'CloudSync',
    type: NodeType.PRODUCT,
    status: ChangeStatus.EXISTING,
    properties: {
      name: 'CloudSync',
      category: 'Data Integration',
      version: '1.5.0',
      launch_date: '2021-09-10',
      price: 1299,
    },
  },

  // Existing nodes - Locations
  {
    id: 'location_1',
    label: 'San Francisco, CA',
    type: NodeType.LOCATION,
    status: ChangeStatus.EXISTING,
    properties: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      population: 873965,
    },
  },
  {
    id: 'location_2',
    label: 'Austin, TX',
    type: NodeType.LOCATION,
    status: ChangeStatus.EXISTING,
    properties: {
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      population: 961855,
    },
  },
  {
    id: 'location_3',
    label: 'Seattle, WA',
    type: NodeType.LOCATION,
    status: ChangeStatus.EXISTING,
    properties: {
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      population: 753675,
    },
  },

  // NEW NODES - Proposed additions
  {
    id: 'company_4',
    label: 'InnovateLabs',
    type: NodeType.COMPANY,
    status: ChangeStatus.NEW,
    properties: {
      name: 'InnovateLabs',
      industry: 'AI/ML',
      founded: 2022,
      employees: 250,
      revenue: '25M',
    },
  },
  {
    id: 'person_6',
    label: 'David Kim',
    type: NodeType.PERSON,
    status: ChangeStatus.NEW,
    properties: {
      name: 'David Kim',
      title: 'Founder & CEO',
      email: 'dkim@innovatelabs.com',
      years_experience: 13,
    },
  },
  {
    id: 'person_7',
    label: 'Lisa Thompson',
    type: NodeType.PERSON,
    status: ChangeStatus.NEW,
    properties: {
      name: 'Lisa Thompson',
      title: 'Senior Engineer',
      email: 'lthompson@cloudventures.com',
      years_experience: 6,
    },
  },
  {
    id: 'product_4',
    label: 'AI Insights',
    type: NodeType.PRODUCT,
    status: ChangeStatus.NEW,
    properties: {
      name: 'AI Insights',
      category: 'Machine Learning',
      version: '1.0.0',
      launch_date: '2024-11-01',
      price: 2499,
    },
  },
  {
    id: 'location_4',
    label: 'Boston, MA',
    type: NodeType.LOCATION,
    status: ChangeStatus.NEW,
    properties: {
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      population: 675647,
    },
  },
];

const mockEdges: GraphEdge[] = [
  // Existing relationships
  {
    id: 'edge_1',
    source: 'person_1',
    target: 'company_1',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.EXISTING,
    properties: {
      start_date: '2010-01-15',
      department: 'Executive',
    },
  },
  {
    id: 'edge_2',
    source: 'person_2',
    target: 'company_1',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.EXISTING,
    properties: {
      start_date: '2012-06-01',
      department: 'Engineering',
    },
  },
  {
    id: 'edge_3',
    source: 'person_3',
    target: 'company_2',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.EXISTING,
    properties: {
      start_date: '2016-03-15',
      department: 'Engineering',
    },
  },
  {
    id: 'edge_4',
    source: 'person_4',
    target: 'company_1',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.EXISTING,
    properties: {
      start_date: '2018-09-01',
      department: 'Product',
    },
  },
  {
    id: 'edge_5',
    source: 'person_5',
    target: 'company_2',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.EXISTING,
    properties: {
      start_date: '2019-02-01',
      department: 'Data Science',
    },
  },
  {
    id: 'edge_6',
    source: 'company_1',
    target: 'product_1',
    relationshipType: RelationshipType.PRODUCES,
    status: ChangeStatus.EXISTING,
    properties: {
      since: '2020-06-15',
      version: '3.2.1',
    },
  },
  {
    id: 'edge_7',
    source: 'company_2',
    target: 'product_2',
    relationshipType: RelationshipType.PRODUCES,
    status: ChangeStatus.EXISTING,
    properties: {
      since: '2019-03-20',
      version: '2.8.0',
    },
  },
  {
    id: 'edge_8',
    source: 'company_3',
    target: 'product_3',
    relationshipType: RelationshipType.PRODUCES,
    status: ChangeStatus.EXISTING,
    properties: {
      since: '2021-09-10',
      version: '1.5.0',
    },
  },
  {
    id: 'edge_9',
    source: 'company_1',
    target: 'location_1',
    relationshipType: RelationshipType.LOCATED_IN,
    status: ChangeStatus.EXISTING,
    properties: {
      headquarters: true,
      office_size: 'Large',
    },
  },
  {
    id: 'edge_10',
    source: 'company_2',
    target: 'location_2',
    relationshipType: RelationshipType.LOCATED_IN,
    status: ChangeStatus.EXISTING,
    properties: {
      headquarters: true,
      office_size: 'Medium',
    },
  },
  {
    id: 'edge_11',
    source: 'company_3',
    target: 'location_3',
    relationshipType: RelationshipType.LOCATED_IN,
    status: ChangeStatus.EXISTING,
    properties: {
      headquarters: true,
      office_size: 'Medium',
    },
  },
  {
    id: 'edge_12',
    source: 'company_1',
    target: 'company_2',
    relationshipType: RelationshipType.PARTNERS_WITH,
    status: ChangeStatus.EXISTING,
    properties: {
      since: '2020-01-01',
      partnership_type: 'Strategic Alliance',
    },
  },
  {
    id: 'edge_13',
    source: 'person_2',
    target: 'person_4',
    relationshipType: RelationshipType.MANAGES,
    status: ChangeStatus.EXISTING,
    properties: {
      since: '2018-09-01',
      direct_report: true,
    },
  },

  // NEW relationships - Proposed additions
  {
    id: 'edge_14',
    source: 'person_6',
    target: 'company_4',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.NEW,
    properties: {
      start_date: '2022-01-01',
      department: 'Executive',
    },
  },
  {
    id: 'edge_15',
    source: 'person_7',
    target: 'company_3',
    relationshipType: RelationshipType.WORKS_AT,
    status: ChangeStatus.NEW,
    properties: {
      start_date: '2023-05-15',
      department: 'Engineering',
    },
  },
  {
    id: 'edge_16',
    source: 'company_4',
    target: 'product_4',
    relationshipType: RelationshipType.PRODUCES,
    status: ChangeStatus.NEW,
    properties: {
      since: '2024-11-01',
      version: '1.0.0',
    },
  },
  {
    id: 'edge_17',
    source: 'company_4',
    target: 'location_4',
    relationshipType: RelationshipType.LOCATED_IN,
    status: ChangeStatus.NEW,
    properties: {
      headquarters: true,
      office_size: 'Small',
    },
  },
  {
    id: 'edge_18',
    source: 'company_1',
    target: 'company_4',
    relationshipType: RelationshipType.PARTNERS_WITH,
    status: ChangeStatus.NEW,
    properties: {
      since: '2024-10-01',
      partnership_type: 'Technology Partner',
    },
  },
  {
    id: 'edge_19',
    source: 'company_4',
    target: 'company_2',
    relationshipType: RelationshipType.PARTNERS_WITH,
    status: ChangeStatus.NEW,
    properties: {
      since: '2024-09-15',
      partnership_type: 'Integration Partner',
    },
  },
  {
    id: 'edge_20',
    source: 'person_4',
    target: 'product_4',
    relationshipType: RelationshipType.MANAGES,
    status: ChangeStatus.NEW,
    properties: {
      since: '2024-11-01',
      role: 'Product Advisory',
    },
  },
  {
    id: 'edge_21',
    source: 'person_3',
    target: 'person_7',
    relationshipType: RelationshipType.MANAGES,
    status: ChangeStatus.NEW,
    properties: {
      since: '2023-05-15',
      direct_report: false,
    },
  },
];

export const mockGraphData: GraphData = {
  nodes: mockNodes,
  edges: mockEdges,
};

// Helper function to get graph statistics
export const getGraphStats = (data: GraphData) => {
  const totalNodes = data.nodes.length;
  const totalEdges = data.edges.length;
  const newNodes = data.nodes.filter((n) => n.status === ChangeStatus.NEW).length;
  const newEdges = data.edges.filter((e) => e.status === ChangeStatus.NEW).length;
  const existingNodes = data.nodes.filter((n) => n.status === ChangeStatus.EXISTING).length;
  const existingEdges = data.edges.filter((e) => e.status === ChangeStatus.EXISTING).length;

  return {
    totalNodes,
    totalEdges,
    newNodes,
    newEdges,
    existingNodes,
    existingEdges,
  };
};
