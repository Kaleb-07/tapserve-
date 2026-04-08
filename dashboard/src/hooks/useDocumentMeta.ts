import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useDocumentMeta = () => {
  const { settings } = useStore();

  useEffect(() => {
    const name = settings?.hotelName;
    if (name) {
      document.title = name;
    }
  }, [settings?.hotelName]);

  useEffect(() => {
    const faviconUrl = settings?.faviconUrl;
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [settings?.faviconUrl]);
};
