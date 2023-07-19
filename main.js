const axios = require('axios');

async function extractURLChunks() {
  const versionArgIndex = process.argv.indexOf('-version');
  const version = versionArgIndex !== -1 ? process.argv[versionArgIndex + 1] : '1.236.0';

  const url = 'https://js-agent.nr-assets.net/nr-loader-spa-' + version + '.js';

  try {
    const response = await axios.get(url);
    const scriptContent = response.data;

    const baseUrl = 'https://js-agent.nr-assets.net/';

    // First slice: match chunkIdRegex starting from 'return "" + ({' until '}[chunkId] || chunkId) + "." + {'
    const firstSliceRegex = /return "" \+ \({([\s\S]*?)\}\[chunkId\] \|\| chunkId\) \+ "." \+ \{/g;
    const firstSliceMatch = firstSliceRegex.exec(scriptContent);
    const firstSliceContent = firstSliceMatch ? firstSliceMatch[1] : '';

    // Extract fileName from the first slice
    const fileNameRegex = /"(\d+)":"(.*?)"/g;
    const firstSliceUrls = [];
    let firstSliceMatchItem;
    while ((firstSliceMatchItem = fileNameRegex.exec(firstSliceContent)) !== null) {
      const id = firstSliceMatchItem[1];
      const fileName = firstSliceMatchItem[2];
      firstSliceUrls.push({ id, fileName });
    }

    // Second slice: match chunkIdRegex starting from '}[chunkId] || chunkId) + "." + {' until '}[chunkId]'
    const secondSliceRegex = /}\[chunkId\] \|\| chunkId\) \+ "." \+ \{([\s\S]*?)\}\[chunkId\]/g;
    const secondSliceMatch = secondSliceRegex.exec(scriptContent);
    const secondSliceContent = secondSliceMatch ? secondSliceMatch[1] : '';

    // Extract chunkId and fileName from the second slice
    const secondSliceUrls = [];
    let secondSliceMatchItem;
    while ((secondSliceMatchItem = fileNameRegex.exec(secondSliceContent)) !== null) {
      const id = secondSliceMatchItem[1];
      const chunkId = secondSliceMatchItem[2];
      secondSliceUrls.push({ id, chunkId });
    }

    // Find matches and store the results
    const matchingResults = [];

    for (let i = 0; i < firstSliceUrls.length; i++) {
      for (let x = 0; x < secondSliceUrls.length; x++) {
        if (firstSliceUrls[i].id === secondSliceUrls[x].id) {
          const match = {
            fileName: firstSliceUrls[i].fileName,
            chunkId: secondSliceUrls[x].chunkId,
          };
          matchingResults.push(match);
          break; // Break the inner loop if a match is found
        }
      }
    }

    // Log matching URLs with desired format
    matchingResults.forEach((match) => {
      console.log(
        `${baseUrl}${match.fileName}.${match.chunkId}-` + version + `.min.js`
      );
    });

    // Store non-matching items from the second slice
    const nonMatchingResults = secondSliceUrls.filter((item) => {
      return !matchingResults.some((match) => match.chunkId === item.chunkId);
    });

    // Log nonMatching URLs with desired format
    nonMatchingResults.forEach((match) => {
      console.log(
        `${baseUrl}${match.id}.${match.chunkId}-` + version + `.min.js`
      );
    });

  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

extractURLChunks();
