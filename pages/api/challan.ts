import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { regNum } = req.query;

  if (!regNum || typeof regNum !== 'string') {
    return res.status(400).json({ error: 'Registration number is required' });
  }

  try {
    const response = await fetch(`https://number.vahanfin.com/echallan/${encodeURIComponent(regNum)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching challan data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch challan data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
