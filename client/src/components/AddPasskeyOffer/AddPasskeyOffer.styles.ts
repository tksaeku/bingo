import styled from 'styled-components';
import { ModalDialog } from '../../styles/Modal';

/** The offer's dialog card, narrower than the win dialog. */
export const OfferDialog = styled(ModalDialog)`
  max-width: 440px;
`;

/** Dialog heading. */
export const OfferTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  font-size: 1.75rem;
  line-height: 1.2;
  color: white;
`;

/** Line under the heading. */
export const OfferMessage = styled.p`
  margin: 0.75rem 0 1.75rem;
  font-size: 0.9375rem;
  font-weight: 300;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Name field, error, then the actions, stacked. */
export const OfferForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

/** Wrapper that keeps the error flush with the form's spacing. */
export const OfferError = styled.div`
  > p {
    margin: 0;
  }
`;

/** Side-by-side dialog actions; stacked on phones. */
export const OfferActions = styled.div`
  display: flex;
  gap: 0.75rem;

  > button {
    flex: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;
