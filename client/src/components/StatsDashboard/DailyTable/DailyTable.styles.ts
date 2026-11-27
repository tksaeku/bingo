import styled from 'styled-components';

/** Scrolls the table sideways on narrow screens instead of widening the page. */
export const TableScroller = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

/** The per-day table. */
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;

  caption {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: right;
    white-space: nowrap;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  thead th {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.mutedText};
  }

  tbody td {
    color: ${({ theme }) => theme.colors.text};
  }

  th:first-child {
    position: sticky;
    left: 0;
    text-align: left;
    background-color: ${({ theme }) => theme.colors.surfaceInset};
    color: ${({ theme }) => theme.colors.text};
  }
`;
