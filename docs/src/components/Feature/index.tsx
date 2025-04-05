import React, { type ReactNode } from 'react'
import clsx from 'clsx'
import Heading from '@theme/Heading'
import styles from './styles.module.css'

export interface FeatureItem {
	title: string;
	description: ReactNode;
	Svg: React.ComponentType<React.ComponentProps<'svg'>>;
	className?: string;
}

export default function Feature({ title, description, Svg, className }: FeatureItem): ReactNode {
	return (
		<div className={clsx('col col--4', className, styles.feature)}>
			<div className={styles.iconContainer}>
				<Svg role="img" />
			</div>
			<div className="text--center padding-horiz--md">
				<Heading as="h3">{title}</Heading>
				<div>{description}</div>
			</div>
		</div>
	)
}
