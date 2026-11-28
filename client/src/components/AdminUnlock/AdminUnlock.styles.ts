import styled from 'styled-components';
import { Card } from '../../styles/Card';
import { eyebrowText } from '../../styles/PageHero';

/** Narrow card for the unlock options, centered horizontally on the page. */
export const KeyCard = styled(Card)`
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
`;

/** Stacked actions and status lines. */
export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  & > button {
    width: 100%;
  }
`;

/** Stacked admin key field and submit button. */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;

  & > button {
    width: 100%;
  }
`;

/** Disclosure that holds the admin key form. */
export const KeyDisclosure = styled.details`
  margin-top: 1.25rem;
`;

/** Clickable disclosure label in the tracked eyebrow style. */
export const KeyDisclosureSummary = styled.summary`
  ${eyebrowText}
  cursor: pointer;
`;

/** Live status line. */
export const StatusText = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedText};

  &:empty {
    display: none;
  }
`;
