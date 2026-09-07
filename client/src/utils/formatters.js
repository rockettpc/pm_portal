/**
 * Localized formatting utilities for CGI PM Portal
 * Supports standard English (en-US) and Spanish (es-US) formats
 */

export const formatDate = (dateInput, lang = 'en', customOptions = null) => {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const locale = lang === 'es' ? 'es-US' : 'en-US';
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(locale, customOptions || defaultOptions).format(date);
};

export const formatDateOnly = (dateInput, lang = 'en') => {
  return formatDate(dateInput, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount, lang = 'en') => {
  const num = Number(amount) || 0;
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (value, lang = 'en', decimals = 0) => {
  const num = Number(value) || 0;
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatHours = (hours, lang = 'en') => {
  const num = Number(hours) || 0;
  const formatted = formatNumber(num, lang, 1);
  return `${formatted} ${lang === 'es' ? 'hrs' : 'hrs'}`;
};
