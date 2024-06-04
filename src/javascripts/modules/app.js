/**
 *  Endpoint Custom Zendesk Summary App
 **/
import React from 'react'
import { render } from 'react-dom'
import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming'
import { Grid, Row, Col } from '@zendeskgarden/react-grid'
import { Title, Paragraph } from "@zendeskgarden/react-notifications"
import { Tag } from '@zendeskgarden/react-tags'
import I18n from '../../javascripts/lib/i18n'
import { resizeContainer } from '../../javascripts/lib/helpers'
import { IconButton } from '@zendeskgarden/react-buttons'
import { SM } from '@zendeskgarden/react-typography'
import { ThumbsDownIcon, ThumbsUpIcon } from '../lib/icons'
import SummaryItem from './SummaryItem'

const MAX_HEIGHT = 2000
const TICKET_CUSTOM_FIELD_PREFIX = 'ticket.customField:custom_field_'

class App {
  constructor (client, _appData) {
    this._client = client
    // this.initializePromise is only used in testing
    // indicate app initilization(including all async operations) is complete
    this.initializePromise = this.init()
  }


  /**
   * Initialize module, render main template
   */
  async init () {
    // Get currentUser is only used for localization
    const currentUser = (await this._client.get('currentUser')).currentUser
    I18n.loadTranslations(currentUser.locale)

    // Get metadata
    const appMetadata = await this._client.metadata().catch(this._handleError.bind(this))
    const EndpointFieldIds = {
      'one_sentence_summary': appMetadata.settings['One Sentence Summary Field ID'],
      'client_sentiment': appMetadata.settings['Client Sentiment Field ID'],
      'bullet_points': appMetadata.settings['Bullet Points Summary Field ID'],
      'action_items': appMetadata.settings['Action Items Field ID'],
      'ai_feedback': appMetadata.settings['AI Feedback Field ID']
    }

    // List all of the initial get queries we are going to make
    const ticketDataFields = [
      'ticket.createdAt',
      TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['one_sentence_summary'],
      TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['client_sentiment'],
      TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['bullet_points'],
      TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['action_items'],
      TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['ai_feedback'], 
    ]

    // Query various AI assistant generated fields
    const ticketAPIResponse = await this._client.get(ticketDataFields).catch(this._handleError.bind(this))

    // Pulling each field for less writing in JSX later
    const bulletPoints = ticketAPIResponse ? ticketAPIResponse[TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['bullet_points']] : ""
    const actionItems = ticketAPIResponse ? ticketAPIResponse[TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['action_items']] : ""
    const oneSentenceSummary = ticketAPIResponse ? ticketAPIResponse[TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['one_sentence_summary']] : ""
    const clientSentiment = ticketAPIResponse ? ticketAPIResponse[TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['client_sentiment']] : ""
    const aiFeedback = ticketAPIResponse ? ticketAPIResponse[TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['ai_feedback']] : ""
    const lastUpdatedTimeStamp = ticketAPIResponse ? ticketAPIResponse['ticket.createdAt'] : ""

    const appContainer = document.querySelector('.main')

    // Define query for setting feedback
    const setFeedback = (feedback) => {
      if (feedback != aiFeedback) this._client.set(TICKET_CUSTOM_FIELD_PREFIX + EndpointFieldIds['ai_feedback'], feedback)
    }

    render(
      <ThemeProvider theme={{ ...DEFAULT_THEME }}>
        <Grid>
          <Row>
          <Col>
              <SummaryItem title="One Sentence Summary" content={oneSentenceSummary} variant="one-sentence-summary"/>
              <div className="EPDivider"></div>
            </Col>
          </Row>
          <Row>
            <Col>
              <SummaryItem title="Action Items" content={actionItems} variant="action-items"/>
              <div className="EPDivider"></div>
            </Col>
          </Row>
          <Row>
          <Col>
              <SummaryItem title="Bullet Points" content={bulletPoints} variant="bullet-points"/>
              <div className="EPDivider"></div>
            </Col>
          </Row>
          <Row style={{marginBottom: 16}}>
            <Col>
              { aiFeedback == "positive" ? 
              <IconButton isSelected size="small" isBasic={false} isPill={false} style={{ marginRight: 8}} onClick={() => setFeedback("positive")}>{ThumbsUpIcon}</IconButton> :
              <IconButton size="small" isBasic={false} isPill={false} style={{ marginRight: 8}} onClick={() => setFeedback("positive")}>{ThumbsUpIcon}</IconButton>
              }
              { aiFeedback == "negative" ? 
              <IconButton isSelected size="small" isBasic={false} isPill={false} onClick={() => setFeedback("negative")}>{ThumbsDownIcon}</IconButton> :
              <IconButton size="small" isBasic={false} isPill={false} onClick={() => setFeedback("negative")}>{ThumbsDownIcon}</IconButton>
              }
            </Col>
          </Row>
          <Row>
            <Col textAlign="center">
              { lastUpdatedTimeStamp ? <SM><Paragraph size="small">Last Updated: {lastUpdatedTimeStamp}</Paragraph></SM> : <></> }
            </Col>
          </Row>
        </Grid>
      </ThemeProvider>,
      appContainer
    )
    return resizeContainer(this._client, MAX_HEIGHT)
  }

  /**
   * Handle error
   * @param {Object} error error object
   */
  _handleError (error) {
    console.log('An error is handled here: ', error.message)
  }
}

export default App
