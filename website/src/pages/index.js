import React from 'react'
import classnames from 'classnames'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'

const features = [
  {
    title: <>No-code</>,
    emoji: '🏖',
    description: (
      <>
        Create a production-ready scalable backend for your app without coding. With Commun weeks of development become
        minutes. Use the UI dashboard to manage your app without writing any code.
      </>
    ),
  },
  {
    title: <>Authentication & Roles</>,
    emoji: '🔑',
    description: (
      <>
        Commun provides secure authentication and role based permission management out of the box. Commun supports email
        and password or third party systems like Google, Facebook or GitHub.
      </>
    ),
  },
  {
    title: <>GraphQL and Rest API</>,
    emoji: '🚀',
    description: (
      <>
        Commun automatically prepares a GraphQL and Rest API backend which you can consume from anywhere.
      </>
    ),
  },
  {
    title: <>Define your logic</>,
    emoji: '🤩',
    description: (
      <>
        Use hooks, permissions, joins and indexes to fulfil your app's requirements. With Commun you can create complex
        and extensible applications without coding.
      </>
    ),
  },
  {
    title: <>Fast full-text search</>,
    emoji: '🔎',
    description: (
      <>
        Out of the box full-text search on one or more attributes. With support for specific weights for each attribute.
      </>
    ),
  },
  {
    title: <>Collaboration friendly</>,
    emoji: '🤝',
    description: (
      <>
        Commun was built with the best collaboration and deployment practices in mind. Your app logic and configuration
        will be entirely in your source control system. This allows teams to set up enterprise level pipelines and
        review practices.
      </>
    ),
  },
]

function Feature ({ title, description, emoji }) {
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {emoji && (
        <div className="text--center">
          <h1>{emoji}</h1>
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function Home () {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <header className={classnames('hero', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/introduction')}>
              Get Started
            </Link>
            <iframe
              className={styles.githubButton}
              src="https://ghbtns.com/github-btn.html?user=commundev&amp;repo=commun&amp;type=star&amp;count=true&amp;size=large"
              title="GitHub Stars"
              width={160}
              height={30}
            />
          </div>
        </div>
      </header>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  )
}

export default Home
