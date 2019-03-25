import React, { useEffect, useContext, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Alert, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import { ProviderActions } from '../../containers/Providers/reducer'

import ChainContext from '../../contexts/Chain'

const Transaction = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ hash: string }>>) => {
  const { match, errorMsgs, dispatch, providerDispatch, loadings, history } = props
  const chain = useContext(ChainContext)
  const [t] = useTranslation()
  const { transaction } = chain

  useEffect(() => {
    // TODO: verify hash
    dispatch(actionCreators.getTransaction(match.params.hash))
    return () => {
      providerDispatch({
        type: ProviderActions.CleanTransaction,
      })
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transaction: '',
        },
      })
    }
  }, [match.params.hash])

  const goBack = useCallback(() => {
    history.goBack()
  }, [])

  const loading = loadings.transaction

  return (
    <Card>
      <Card.Header>
        <Card.Text>
          <b>{`${t('history.transaction-hash')}: `}</b>
          {loading ? 'Loading' : transaction.hash}
        </Card.Text>
      </Card.Header>
      <Card.Body>
        {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transaction}`)}</Alert> : null}
        <Card.Text>
          <b>{`${t('history.amount')}: `}</b>
          {loading ? 'Loading' : transaction.value}
        </Card.Text>
        <Card.Text>
          <b>{`${t('history.date')}: `}</b>
          {loading ? 'Loading' : new Date(transaction.date).toLocaleString()}
        </Card.Text>
      </Card.Body>
      <Card.Footer>
        <Button variant="primary" onClick={goBack} onKeyPress={goBack}>
          {t('transaction.goBack')}
        </Button>
      </Card.Footer>
    </Card>
  )
}

Transaction.displayName = 'Transaction'
export default Transaction