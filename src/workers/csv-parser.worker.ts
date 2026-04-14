import Papa from 'papaparse';

self.onmessage = (event: MessageEvent<{ file: File }>) => {
  const { file } = event.data;

  let rowCount = 0;
  let previewData: Record<string, unknown>[] = [];

  // First Pass: Get Schema (first 200 rows)
  Papa.parse(file, {
    preview: 200,
    header: true,
    complete: (results) => {
      previewData = results.data as Record<string, unknown>[];
      
      // Second Pass: Get Row Count (Full Stream)
      Papa.parse(file, {
        chunk: (results) => {
          rowCount += results.data.length;
        },
        complete: () => {
          self.postMessage({
            type: 'done',
            payload: {
              schema: results.meta.fields || [],
              previewData,
              totalRows: rowCount,
            }
          });
        },
        error: (err) => {
          self.postMessage({ type: 'error', payload: err.message });
        }
      });
    },
    error: (err) => {
      self.postMessage({ type: 'error', payload: err.message });
    }
  });
};
