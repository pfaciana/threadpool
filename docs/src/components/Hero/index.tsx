import React, { type ReactNode } from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import Heading from '@theme/Heading'
import styles from './styles.module.css'

export interface HeroProps {
	title: string;
	tagline: string;
	primaryButton: {
		text: string;
		link: string;
	};
	secondaryButton: {
		text: string;
		link: string;
	};
	className?: string;
}

export default function Hero({ title, tagline, primaryButton, secondaryButton, stats, className }: HeroProps): ReactNode {
	return (<header className={clsx('hero', styles.heroBanner, className)}>
			<div className="container">
				<div className={styles.heroContent}>
					<div className={styles.heroText}>
						<Heading as="h1" className={styles.heroTitle}>{title}</Heading>
						<p className={styles.heroSubtitle}>{tagline}</p>
						<div className={styles.buttons}>
							<Link
								className="button button--primary button--lg"
								to={primaryButton.link}>
								{primaryButton.text}
							</Link>
							<Link
								className="button button--secondary button--lg"
								to={secondaryButton.link}>
								{secondaryButton.text}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</header>
	)
}
