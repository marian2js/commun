import React from 'react'
import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import classnames from 'classnames'
import styles from './styles.module.css'

const Showcase = () => {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  const projects = [{
    title: 'FinSharing.com',
    image: '/img/showcase/finsharing.png',
    url: 'https://finsharing.com',
    description: 'Community for Stock Market discussions, ideas and investment strategies.',
  }, {
    title: 'Share Newsletters',
    image: '/img/showcase/sharenewsletters.png',
    url: 'https://sharenewsletters.com',
    description: 'Share and discover Newsletters.',
  }]

  return (
    <Layout
      title={`Showcase for ${siteConfig.title}`}
      description={`List of showcases for ${siteConfig.title}`}>
      <div className="container">
        <div className="text--center">
          <h1>Showcase</h1>
          <p>Awesome projects powered by Commun</p>
        </div>
        <div className="row">
          {
            projects.map((project, i) => (
              <div key={i} className="col col--4 margin-bottom--lg">
                <a href={project.url} target="_blank" rel="noopener" className={classnames(styles.showcaseLink)}>
                  <div className={classnames('card', styles.showcaseCard)}>
                    <div className="card__image">
                      <img src={project.image} alt={project.title}/>
                    </div>
                    <div className="card__body">
                      <div className="avatar">
                        <div className="avatar__intro margin-left--none">
                          <h4 className="avatar__name">{project.title}</h4>
                          <small className="avatar__subtitle">
                            {project.description}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))
          }
        </div>
      </div>
    </Layout>
  )
}

export default Showcase
