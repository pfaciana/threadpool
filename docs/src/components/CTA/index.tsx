import React, { type ReactNode } from 'react'
import Link from '@docusaurus/Link'
import Heading from '@theme/Heading'
import styles from './styles.module.css'

export interface CTAButton {
	text: string;
	link: string;
	isPrimary: boolean;
}

export interface CTAProps {
	title: string;
	description: ReactNode;
	buttons: CTAButton[];
	className?: string;
}

export default function CTA({ title, description, buttons, className }: CTAProps): ReactNode {
	return (
		<section className={`${styles.ctaSection} ${className || ''}`}>
			<div className="container">
				<Heading as="h2">{title}</Heading>
				<p>{description}</p>
				<div className={styles.ctaButtons}>
					{buttons.map((button, idx) => (
						<Link
							key={idx}
							className={`button button--lg ${button.isPrimary ? 'button--primary' : 'button--secondary'}`}
							to={button.link}>
							{button.text}
						</Link>
					))}
				</div>
			</div>
		</section>
	)
}
