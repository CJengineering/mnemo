global.fetch = jest.fn((url, options) => {
    if (url === "/api/programmes") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, programmes: [{ id: "1", name: "J-PAL" }] }),
      });
    }
  
    if (url === "/api/data-chunk") {
      if (options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, dataChunk: { id: "123" } }),
        });
      }
    }
  
    return Promise.reject(new Error("API Call Failed"));
  }) as jest.Mock;
  