import { useState, useEffect } from "react";

interface FetchResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ErrorResponse {
  status: "error";
  message: string;
}

export function useFetch<T>(
  url: string | null,
  deps: any = null
): FetchResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        const jsonData = await response.json();

        if (!response.ok) {
          const errorData = jsonData as ErrorResponse;
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        if (isMounted) {
          setData(jsonData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, deps]);

  return { data, loading, error };
}
