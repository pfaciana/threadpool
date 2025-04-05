import React, { type ReactNode } from 'react'
import Feature, { type FeatureItem } from '../Feature'
import styles from './styles.module.css'
import Heading from '@theme/Heading'

export interface FeatureSectionProps {
	title: string;
	subtitle: string;
	features: FeatureItem[];
	className?: string;
}

export default function FeatureSection({ title, subtitle, features, className }: FeatureSectionProps): ReactNode {
	return (
		<section className={`${styles.featureSection} ${className || ''}`}>
			<div className="container">
				<div className="row">
					<div className="col col--12 text--center margin-bottom--lg">
						<Heading as="h2">{title}</Heading>
						<p className={styles.featureSubtitle}>
							{subtitle}
						</p>
					</div>
					{features.map((featureProps, idx) => (
						<Feature {...featureProps} />
					))}
				</div>
			</div>
		</section>
	)
}
