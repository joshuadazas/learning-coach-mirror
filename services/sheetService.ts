
import type { LearningResource } from '../types';
import { GOOGLE_SHEET_CSV_URL } from '../constants';

// This parser assumes a simple CSV format without quoted commas, which is true for the source sheet.
const parseCSV = (csvText: string): LearningResource[] => {
  const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const resources: LearningResource[] = [];

  const titleIndex = headers.indexOf('title');
  const typeIndex = headers.indexOf('type');
  const urlIndex = headers.indexOf('url');
  const priceIndex = headers.indexOf('price');
  const descriptionIndex = headers.indexOf('description');
  const keywordsIndex = headers.indexOf('keywords');

  for (let i = 1; i < lines.length; i++) {
    // This simple split is fragile but works for the current clean data.
    // It does not handle commas within quoted fields.
    const data = lines[i].split(',');
    if (data.length < headers.length) continue;

    const typedResource: LearningResource = {
      title: data[titleIndex]?.trim() || '',
      type: (data[typeIndex]?.trim() as LearningResource['type']) || 'Article',
      url: data[urlIndex]?.trim() || '',
      price: data[priceIndex]?.trim() || 'Free',
      description: data[descriptionIndex]?.trim() || '',
      keywords: data[keywordsIndex] ? data[keywordsIndex].trim().split(';').map(k => k.trim()) : [],
    };
    resources.push(typedResource);
  }
  return resources;
};

export const fetchLearningResources = async (): Promise<LearningResource[]> => {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching or parsing learning resources:', error);
    throw new Error('Could not load learning resources from the data source.');
  }
};
